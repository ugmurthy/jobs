# Redis Setup Guide

This guide provides instructions for setting up Redis with persistence, covering both local installation and the Redis.io free tier cloud service.

## Table of Contents

- [Introduction to Redis](#introduction-to-redis)
- [Local Redis Installation](#local-redis-installation)
  - [macOS](#macos)
  - [Linux](#linux)
  - [Windows](#windows)
  - [Configuring Persistence Locally](#configuring-persistence-locally)
- [Redis.io Free Tier Cloud Setup](#redisio-free-tier-cloud-setup)
  - [Creating a Free Tier Account](#creating-a-free-tier-account)
  - [Setting Up a Database](#setting-up-a-database)
  - [Connecting to Your Redis Cloud Instance](#connecting-to-your-redis-cloud-instance)
  - [Persistence in Redis Cloud](#persistence-in-redis-cloud)
- [Updating Application Configuration](#updating-application-configuration)
- [Basic Redis Commands](#basic-redis-commands)
- [Troubleshooting](#troubleshooting)

## Introduction to Redis

Redis is an open-source, in-memory data structure store that can be used as a database, cache, message broker, and streaming engine. It supports various data structures such as strings, hashes, lists, sets, and more.

For our JobRunner application, Redis is used for:
- Job queue management with BullMQ
- WebSocket state management
- Caching and temporary data storage

## Local Redis Installation

### macOS

Using Homebrew (recommended):

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Redis
brew install redis

# Start Redis service
brew services start redis

# Verify Redis is running
redis-cli ping
# Should return "PONG"
```

Manual start/stop commands:
```bash
# Start Redis server
redis-server

# Stop Redis (using brew)
brew services stop redis
```

### Linux

For Ubuntu/Debian:

```bash
# Update package lists
sudo apt update

# Install Redis
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis-server

# Enable Redis to start on boot
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
# Should return "PONG"
```

For RHEL/CentOS/Fedora:

```bash
# Install Redis
sudo dnf install redis

# Start Redis service
sudo systemctl start redis

# Enable Redis to start on boot
sudo systemctl enable redis

# Verify Redis is running
redis-cli ping
# Should return "PONG"
```

### Windows

Redis is not officially supported on Windows, but you have several options:

1. **Windows Subsystem for Linux (WSL)** (Recommended):
   - Install WSL: `wsl --install`
   - Install a Linux distribution from the Microsoft Store
   - Follow the Linux installation instructions above

2. **Using Docker**:
   ```bash
   # Pull Redis image
   docker pull redis
   
   # Run Redis container
   docker run --name redis-instance -p 6379:6379 -d redis
   
   # Verify Redis is running
   docker exec -it redis-instance redis-cli ping
   # Should return "PONG"
   ```

3. **Unofficial Windows Builds** (not recommended for production):
   - Download from [https://github.com/tporadowski/redis/releases](https://github.com/tporadowski/redis/releases)
   - Follow the installation instructions provided with the download

### Configuring Persistence Locally

Redis offers two main persistence options:

1. **RDB (Redis Database)**: Point-in-time snapshots at specified intervals
2. **AOF (Append Only File)**: Logs every write operation

To enable persistence, edit the Redis configuration file:

- macOS (Homebrew): `/usr/local/etc/redis.conf` or `/opt/homebrew/etc/redis.conf`
- Linux: `/etc/redis/redis.conf`
- Windows (WSL): Same as Linux
- Docker: You'll need to create a custom configuration file and mount it

#### Recommended Persistence Configuration

Add or modify these settings in your redis.conf file:

```
# RDB Persistence
save 900 1      # Save if at least 1 key changed in 15 minutes
save 300 10     # Save if at least 10 keys changed in 5 minutes
save 60 10000   # Save if at least 10000 keys changed in 1 minute
dbfilename dump.rdb
dir /var/lib/redis    # Directory where the RDB file is stored

# AOF Persistence
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec  # Sync once per second (balance between performance and safety)
```

After modifying the configuration, restart Redis:

```bash
# macOS
brew services restart redis

# Linux
sudo systemctl restart redis-server

# Docker
docker restart redis-instance
```

## Redis.io Free Tier Cloud Setup

Redis.io (Redis Cloud) offers a free tier that includes:
- 30MB database size
- 30 simultaneous connections
- Persistence enabled by default
- Shared CPU resources

### Creating a Free Tier Account

1. Visit [Redis.io](https://redis.io/try-free/) or [Redis Cloud](https://redis.com/try-free/)
2. Click "Try Free" or "Get Started"
3. Sign up with your email or using a social login
4. Verify your email address if required
5. Complete the registration process

### Setting Up a Database

1. After logging in, you'll be directed to the Redis Cloud console
2. Click "Create Database" or similar option
3. Select "Fixed" (free) subscription tier
4. Choose a cloud provider (typically AWS, GCP, or Azure) and region closest to your application
5. Name your database (e.g., "jobrunner-dev")
6. Click "Create" or "Activate"

### Connecting to Your Redis Cloud Instance

Once your database is created, you'll receive connection details:

1. From the Redis Cloud console, select your database
2. Look for the "Connect" or "Configuration" section
3. Note the following details:
   - Endpoint/Host (e.g., `redis-12345.c12345.us-east-1-1.ec2.cloud.redislabs.com`)
   - Port (typically 12345)
   - Password (auto-generated)

Connection string format:
```
redis://default:PASSWORD@ENDPOINT:PORT
```

### Persistence in Redis Cloud

The Redis.io free tier has persistence enabled by default with the following characteristics:

- **Data Persistence**: AOF (Append Only File) is enabled
- **Backup**: Daily backups are included
- **Durability**: Data is replicated across multiple availability zones

No additional configuration is needed for persistence on Redis.io free tier.

## Updating Application Configuration

To use your Redis instance with JobRunner, update the `.env` file:

For local Redis:
```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Leave empty if no password set
```

For Redis.io cloud:
```
REDIS_HOST=redis-12345.c12345.us-east-1-1.ec2.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your_password_here
```

The application's Redis configuration is in `src/config/redis.ts` and should automatically use these environment variables.

## Basic Redis Commands

Here are some useful Redis commands for managing and monitoring your Redis instance:

```bash
# Connect to Redis CLI
redis-cli                     # Local Redis
redis-cli -h HOST -p PORT -a PASSWORD  # Remote Redis

# Check if Redis is running
redis-cli ping

# Get server info
redis-cli info

# Monitor all commands in real-time
redis-cli monitor

# Check memory usage
redis-cli info memory

# List all keys
redis-cli keys *

# Get value of a key
redis-cli get KEY_NAME

# Delete a key
redis-cli del KEY_NAME

# Flush all data (CAUTION!)
redis-cli flushall

# Check persistence status
redis-cli info persistence
```

## Troubleshooting

### Common Issues with Local Redis

1. **Redis server not starting**:
   - Check error logs: `tail -f /var/log/redis/redis-server.log`
   - Verify permissions on Redis directories
   - Ensure Redis port (6379) is not in use by another service

2. **Connection refused**:
   - Verify Redis is running: `ps aux | grep redis`
   - Check if firewall is blocking connections
   - Ensure you're using the correct host and port

3. **Authentication failed**:
   - Verify the password in your configuration
   - Check if Redis is configured to require authentication

### Common Issues with Redis.io Free Tier

1. **Connection timeout**:
   - Verify your network can reach the Redis Cloud endpoint
   - Check if you've exceeded the 30 connection limit
   - Ensure you're using the correct endpoint and port

2. **Database size limit reached**:
   - Free tier is limited to 30MB
   - Monitor your usage in the Redis Cloud console
   - Consider cleaning up unused keys or upgrading your plan

3. **Slow performance**:
   - Free tier uses shared resources
   - Consider using connection pooling to optimize connections
   - Implement efficient key expiration strategies

For additional help, refer to:
- [Redis Documentation](https://redis.io/documentation)
- [Redis Cloud Documentation](https://docs.redis.com/latest/rc/)