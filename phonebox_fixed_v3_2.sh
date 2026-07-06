#!/data/data/com.termux/files/usr/bin/bash
# ╔══════════════════════════════════════════════════════════════════════╗
# ║  PHONEBOX v3.2 — Termux Local VM Bootstrap                          ║
# ║  Alpine VM + Docker + Supabase + MCP                                ║
# ║  Fixed: mounted answerfile, QEMU forwarding, SSH wait, safer MCP     ║
# ╚══════════════════════════════════════════════════════════════════════╝

set -Eeuo pipefail

# ── Configuration ──────────────────────────────────────────────────────
PHONEBOX_DIR="${PHONEBOX_DIR:-$HOME/phonebox}"
VM_DISK="$PHONEBOX_DIR/alpine.qcow2"
VM_PID="$PHONEBOX_DIR/vm.pid"
LOG="$PHONEBOX_DIR/phonebox.log"
ANSWER_DIR="$PHONEBOX_DIR/answerfile"
ANSWER_FILE="$ANSWER_DIR/answers"
ISO_FILE="$PHONEBOX_DIR/alpine.iso"

# NOTE:
# x86_64 works best on x86_64 laptops.
# On Android ARM phones this will emulate x86_64 and will be slow. Docker-in-VM can work,
# but Supabase is heavy. This is not magic; physics remains annoyingly employed.
ISO_URL="${ISO_URL:-https://dl-cdn.alpinelinux.org/alpine/v3.20/releases/x86_64/alpine-virt-3.20.3-x86_64.iso}"

VM_SSH_PORT="${VM_SSH_PORT:-2222}"
SUPABASE_PORT="${SUPABASE_PORT:-8000}"
STUDIO_PORT="${STUDIO_PORT:-3000}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
DOCKER_PORT="${DOCKER_PORT:-2375}"

VM_RAM="${VM_RAM:-2048}"
VM_CPUS="${VM_CPUS:-2}"
VM_DISK_SIZE="${VM_DISK_SIZE:-20G}"

GRN='\033[0;32m'
YEL='\033[1;33m'
RED='\033[0;31m'
BLU='\033[0;34m'
NC='\033[0m'

mkdir -p "$PHONEBOX_DIR"
touch "$LOG"

log()  { echo -e "${BLU}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG"; }
ok()   { echo -e "${GRN}✓${NC} $1" | tee -a "$LOG"; }
warn() { echo -e "${YEL}⚠${NC} $1" | tee -a "$LOG"; }
err()  { echo -e "${RED}✗${NC} $1" | tee -a "$LOG" >&2; }

die() {
    err "$1"
    exit 1
}

ensure_termux() {
    if [ -z "${TERMUX_VERSION:-}" ] && [ ! -d "/data/data/com.termux/files" ]; then
        die "This script is meant for Termux. Install Termux from F-Droid first."
    fi
}

install_deps() {
    log "Checking/installing Termux dependencies..."
    pkg update -y
    pkg install -y \
        qemu-utils \
        qemu-system-x86_64-headless \
        openssh \
        wget \
        curl \
        git \
        nodejs-lts \
        python \
        expect \
        netcat-openbsd
    ok "Dependencies verified"
}

create_vm_disk() {
    if [ -f "$VM_DISK" ]; then
        ok "VM disk exists: $VM_DISK"
        return
    fi

    log "Creating VM disk ($VM_DISK_SIZE sparse qcow2)..."
    qemu-img create -f qcow2 "$VM_DISK" "$VM_DISK_SIZE"
    ok "VM disk created"
}

download_iso() {
    if [ -f "$ISO_FILE" ]; then
        ok "ISO already downloaded: $ISO_FILE"
        return
    fi

    log "Downloading Alpine ISO..."
    wget --progress=bar:force -O "$ISO_FILE" "$ISO_URL" || die "Download failed."
    ok "ISO downloaded"
}

write_answerfile() {
    mkdir -p "$ANSWER_DIR"

    cat > "$ANSWER_FILE" <<'ANSWER_EOF'
KEYMAPOPTS="us us"
HOSTNAMEOPTS="phonebox"
INTERFACESOPTS="auto lo
iface lo inet loopback

auto eth0
iface eth0 inet dhcp
"
DNSOPTS="8.8.8.8 1.1.1.1"
TIMEZONEOPTS="UTC"
PROXYOPTS="none"
APKREPOSOPTS="http://dl-cdn.alpinelinux.org/alpine/v3.20/main
http://dl-cdn.alpinelinux.org/alpine/v3.20/community
"
SSHDOPTS="openssh"
NTPOPTS="chrony"
DISKOPTS="-m sys /dev/vda"
USEROPTS="-a phonebox"
ANSWER_EOF

    ok "Alpine answerfile written"
}

start_answer_server() {
    local port=8765
    if [ -f "$PHONEBOX_DIR/answer-server.pid" ] && kill -0 "$(cat "$PHONEBOX_DIR/answer-server.pid")" 2>/dev/null; then
        ok "Answerfile server already running"
        return
    fi

    log "Starting tiny local answerfile server..."
    (
        cd "$ANSWER_DIR"
        python -m http.server "$port" > "$PHONEBOX_DIR/answer-server.log" 2>&1
    ) &
    echo $! > "$PHONEBOX_DIR/answer-server.pid"
    sleep 1
    ok "Answerfile server listening on localhost:$port"
}

stop_answer_server() {
    if [ -f "$PHONEBOX_DIR/answer-server.pid" ]; then
        kill "$(cat "$PHONEBOX_DIR/answer-server.pid")" 2>/dev/null || true
        rm -f "$PHONEBOX_DIR/answer-server.pid"
    fi
}

qemu_common_net() {
    printf "%s" "user,id=n1,hostfwd=tcp:127.0.0.1:${VM_SSH_PORT}-:22,hostfwd=tcp:127.0.0.1:${SUPABASE_PORT}-:8000,hostfwd=tcp:127.0.0.1:${STUDIO_PORT}-:3000,hostfwd=tcp:127.0.0.1:${POSTGRES_PORT}-:5432,hostfwd=tcp:127.0.0.1:${DOCKER_PORT}-:2375"
}

install_alpine() {
    if [ -f "$PHONEBOX_DIR/.installed" ]; then
        ok "Alpine already installed to virtual disk"
        return
    fi

    write_answerfile
    start_answer_server

    log "Booting Alpine ISO and running scripted install..."
    warn "This stage uses expect because ISO console timing is hostile goblin behavior."

    expect <<EXPECT_EOF
set timeout 420
spawn qemu-system-x86_64 \
    -m $VM_RAM -smp $VM_CPUS \
    -cdrom "$ISO_FILE" \
    -drive file="$VM_DISK",format=qcow2,if=virtio \
    -netdev $(qemu_common_net) \
    -device virtio-net,netdev=n1 \
    -nographic -boot d

expect {
    "localhost login:" {
        send "root\r"
    }
    timeout {
        puts "Timed out waiting for Alpine login"
        exit 1
    }
}

expect "# "
send "wget -O /tmp/answers http://10.0.2.2:8765/answers\r"
expect "# "
send "printf 'phonebox\\nphonebox\\n' | setup-alpine -f /tmp/answers\r"

expect {
    "Installation is complete" {
        send "poweroff\r"
    }
    "reboot" {
        send "poweroff\r"
    }
    timeout {
        puts "Timed out waiting for Alpine installation to complete"
        exit 1
    }
}

expect eof
EXPECT_EOF

    stop_answer_server

    ok "Alpine installed to VM disk"
    touch "$PHONEBOX_DIR/.installed"
}

start_vm() {
    if [ -f "$VM_PID" ] && kill -0 "$(cat "$VM_PID")" 2>/dev/null; then
        ok "VM already running, PID $(cat "$VM_PID")"
        return
    fi

    log "Starting VM..."
    qemu-system-x86_64 \
        -m "$VM_RAM" -smp "$VM_CPUS" \
        -nographic \
        -drive file="$VM_DISK",format=qcow2,if=virtio \
        -netdev "$(qemu_common_net)" \
        -device virtio-net,netdev=n1 \
        -daemonize \
        -pidfile "$VM_PID"

    ok "VM launched"
}

wait_for_ssh() {
    log "Waiting for SSH on localhost:$VM_SSH_PORT..."
    for i in $(seq 1 36); do
        if nc -z 127.0.0.1 "$VM_SSH_PORT" >/dev/null 2>&1; then
            if sshpassless_root "echo ok" >/dev/null 2>&1; then
                ok "SSH ready"
                return 0
            fi
        fi
        sleep 5
    done
    die "SSH never became ready. Try './phonebox.sh logs' or './phonebox.sh stop' then start again."
}

sshpassless_root() {
    ssh \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o ConnectTimeout=8 \
        -p "$VM_SSH_PORT" \
        root@127.0.0.1 "$@"
}

provision_vm() {
    if sshpassless_root "test -f /root/.phonebox-provisioned" 2>/dev/null; then
        ok "VM already provisioned"
        return
    fi

    log "Provisioning Alpine packages and services..."

    sshpassless_root "cat > /root/provision-phonebox.sh <<'REMOTE_EOF'
#!/bin/sh
set -e

echo 'http://dl-cdn.alpinelinux.org/alpine/v3.20/main' > /etc/apk/repositories
echo 'http://dl-cdn.alpinelinux.org/alpine/v3.20/community' >> /etc/apk/repositories

apk update
apk add \
  openrc \
  openssh \
  sudo \
  curl \
  git \
  nodejs \
  npm \
  openssl \
  docker \
  docker-cli-compose \
  docker-compose

rc-update add sshd default || true
rc-update add docker default || true

sed -i 's/^#*PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config

echo 'root:phonebox' | chpasswd
adduser -D phonebox 2>/dev/null || true
echo 'phonebox:phonebox' | chpasswd
echo 'phonebox ALL=(ALL) NOPASSWD: ALL' > /etc/sudoers.d/phonebox
chmod 440 /etc/sudoers.d/phonebox

service sshd restart || rc-service sshd restart || true
service docker start || rc-service docker start || true

touch /root/.phonebox-provisioned
REMOTE_EOF
chmod +x /root/provision-phonebox.sh
/root/provision-phonebox.sh"

    ok "VM provisioned"
}

install_supabase() {
    if sshpassless_root "test -d /root/supabase/docker && test -f /root/.phonebox-credentials" 2>/dev/null; then
        ok "Supabase config already exists"
        return
    fi

    log "Installing Supabase docker stack..."

    sshpassless_root "cat > /root/install-supabase.sh <<'REMOTE_EOF'
#!/bin/sh
set -e

service docker start || rc-service docker start || true
cd /root

if [ ! -d supabase ]; then
    git clone --depth 1 https://github.com/supabase/supabase.git
fi

cd /root/supabase/docker
cp .env.example .env

POSTGRES_PASSWORD="$(openssl rand -hex 24)"
JWT_SECRET="$(openssl rand -hex 32)"

# Supabase anon/service keys are JWTs, not random base64 strings.
# Keep examples until you generate real JWTs with the local JWT_SECRET.
# This prevents silently poisoning the stack with invalid credentials.
sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env
sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env

cat > /root/.phonebox-credentials <<CREDS_EOF
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
NOTE=ANON_KEY and SERVICE_ROLE_KEY must be JWTs signed with JWT_SECRET. Do not replace them with random strings.
CREDS_EOF
chmod 600 /root/.phonebox-credentials

docker compose pull || docker-compose pull
touch /root/.phonebox-supabase-installed
REMOTE_EOF
chmod +x /root/install-supabase.sh
/root/install-supabase.sh"

    ok "Supabase stack installed"
}

install_mcp() {
    if sshpassless_root "test -d /root/mcp-server" 2>/dev/null; then
        ok "MCP runtime already exists"
        return
    fi

    log "Installing MCP server..."

    sshpassless_root "cat > /root/install-mcp.sh <<'REMOTE_EOF'
#!/bin/sh
set -e

cd /root
mkdir -p mcp-server
cd mcp-server

npm init -y
npm pkg set type=module
npm install @modelcontextprotocol/sdk

cat > index.js <<'MCP_EOF'
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execFileSync, execSync } from "child_process";

function sh(cmd) {
  return execSync(cmd, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30000,
    shell: "/bin/sh",
  });
}

const server = new Server(
  { name: "phonebox-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "phonebox_status",
      description: "Check Docker engine status",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "docker_ps",
      description: "List active local containers",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "supabase_start",
      description: "Start Supabase stack",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "supabase_stop",
      description: "Stop Supabase stack",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "supabase_logs",
      description: "Show Supabase logs",
      inputSchema: {
        type: "object",
        properties: { service: { type: "string" } },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    if (name === "phonebox_status") {
      const out = sh("docker info --format '{{.ServerVersion}}' 2>/dev/null || echo not-running");
      return { content: [{ type: "text", text: `Docker: ${out.trim()}` }] };
    }

    if (name === "docker_ps") {
      const out = sh("docker ps --format 'table {{.Names}}\\t{{.Status}}'");
      return { content: [{ type: "text", text: out || "No containers running" }] };
    }

    if (name === "supabase_start") {
      const out = sh("cd /root/supabase/docker && (docker compose up -d || docker-compose up -d) 2>&1");
      return { content: [{ type: "text", text: `Started\n${out}` }] };
    }

    if (name === "supabase_stop") {
      const out = sh("cd /root/supabase/docker && (docker compose down || docker-compose down) 2>&1");
      return { content: [{ type: "text", text: `Stopped\n${out}` }] };
    }

    if (name === "supabase_logs") {
      const service = String(args.service || "supabase-db").replace(/[^a-zA-Z0-9_.-]/g, "");
      const out = sh(`docker logs --tail 80 ${service} 2>&1`);
      return { content: [{ type: "text", text: out }] };
    }

    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (e) {
    return {
      content: [{ type: "text", text: `Error: ${e.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
MCP_EOF

cat > start-mcp.sh <<'START_EOF'
#!/bin/sh
cd /root/mcp-server
if [ -f /var/run/mcp.pid ] && kill -0 "$(cat /var/run/mcp.pid)" 2>/dev/null; then
  exit 0
fi
nohup node index.js > /var/log/mcp.log 2>&1 &
echo $! > /var/run/mcp.pid
START_EOF
chmod +x start-mcp.sh

mkdir -p /etc/local.d
cat > /etc/local.d/phonebox-mcp.start <<'LOCAL_EOF'
#!/bin/sh
/root/mcp-server/start-mcp.sh
LOCAL_EOF
chmod +x /etc/local.d/phonebox-mcp.start
rc-update add local default 2>/dev/null || true

touch /root/.phonebox-mcp-installed
REMOTE_EOF
chmod +x /root/install-mcp.sh
/root/install-mcp.sh"

    ok "MCP runtime installed"
}

start_services() {
    log "Starting VM services..."

    sshpassless_root "
        service docker start 2>/dev/null || rc-service docker start 2>/dev/null || true
        sleep 3
        if [ -d /root/supabase/docker ]; then
          cd /root/supabase/docker && (docker compose up -d || docker-compose up -d) || true
        fi
        if [ -x /root/mcp-server/start-mcp.sh ]; then
          /root/mcp-server/start-mcp.sh || true
        fi
        echo online
    " >/dev/null

    ok "Services started"
}

show_status() {
    if [ ! -f "$VM_PID" ] || ! kill -0 "$(cat "$VM_PID")" 2>/dev/null; then
        err "VM offline"
        return 1
    fi

    echo ""
    echo -e "${GRN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GRN}║                  PHONEBOX ACTIVE                            ║${NC}"
    echo -e "${GRN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    sshpassless_root "
        echo '=== Docker ==='
        docker info --format 'Server: {{.ServerVersion}}' 2>/dev/null || echo 'Docker not responding'
        echo ''
        echo '=== Containers ==='
        docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || echo 'No containers'
    " 2>/dev/null || warn "VM is running, but SSH is not ready yet."

    echo ""
    echo -e "${BLU}Localhost hooks:${NC}"
    echo -e "  Supabase/Kong: ${YEL}http://127.0.0.1:$SUPABASE_PORT${NC}"
    echo -e "  Studio:        ${YEL}http://127.0.0.1:$STUDIO_PORT${NC}"
    echo -e "  Postgres:      ${YEL}127.0.0.1:$POSTGRES_PORT${NC}"
    echo -e "  SSH:           ${YEL}ssh -p $VM_SSH_PORT root@127.0.0.1${NC}"
    echo ""
}

cmd_install() {
    ensure_termux
    install_deps
    create_vm_disk
    download_iso
    install_alpine
    start_vm
    wait_for_ssh
    provision_vm
    install_supabase
    install_mcp
    ok "Install complete. Run: ./phonebox.sh start"
}

cmd_start() {
    [ -f "$PHONEBOX_DIR/.installed" ] || die "No VM image found. Run: ./phonebox.sh install"
    start_vm
    wait_for_ssh
    start_services
    show_status
}

cmd_stop() {
    if [ -f "$VM_PID" ]; then
        log "Stopping VM..."
        kill "$(cat "$VM_PID")" 2>/dev/null || true
        rm -f "$VM_PID"
        ok "Stopped"
    else
        warn "VM is not active"
    fi
}

cmd_status() { show_status; }

cmd_shell() {
    ssh \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -p "$VM_SSH_PORT" \
        root@127.0.0.1
}

cmd_logs() {
    sshpassless_root "
        if [ -d /root/supabase/docker ]; then
          cd /root/supabase/docker && (docker compose logs --tail 80 || docker-compose logs --tail 80)
        else
          echo 'Supabase not installed yet'
        fi
    "
}

cmd_keys() {
    sshpassless_root "cat /root/.phonebox-credentials 2>/dev/null || echo 'No credentials yet'"
}

cmd_reset_install_flag() {
    rm -f "$PHONEBOX_DIR/.installed"
    ok "Install flag removed. Disk was not deleted."
}

case "${1:-}" in
    install) cmd_install ;;
    start)   cmd_start ;;
    stop)    cmd_stop ;;
    status)  cmd_status ;;
    shell)   cmd_shell ;;
    logs)    cmd_logs ;;
    keys|mcp) cmd_keys ;;
    reset-flag) cmd_reset_install_flag ;;
    *)
        echo ""
        echo -e "${GRN}╔══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GRN}║                     PHONEBOX v3.2                            ║${NC}"
        echo -e "${GRN}╚══════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo "Usage:"
        echo "  ./phonebox.sh install     Full VM install + provisioning"
        echo "  ./phonebox.sh start       Start VM and services"
        echo "  ./phonebox.sh stop        Stop VM"
        echo "  ./phonebox.sh status      Show status"
        echo "  ./phonebox.sh shell       SSH into Alpine VM"
        echo "  ./phonebox.sh logs        Supabase compose logs"
        echo "  ./phonebox.sh keys        Show local credential envelope"
        echo "  ./phonebox.sh reset-flag  Remove install marker only; keeps disk"
        echo ""
        ;;
esac
