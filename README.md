# Viken Bad Project Management System

A PHP-based project management system for tracking time logs and managing projects.

## Requirements

- PHP 8.0 or higher
- MySQL 5.7 or higher
- Apache/Nginx web server
- mod_rewrite enabled (for Apache)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/AdhamBanishamsah/vikenbad01.git
```

2. Configure your web server to point to the project's root directory

3. Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

4. Import the database schema:
```bash
mysql -u your_username -p your_database < schema.sql
```

5. Ensure the following directories are writable:
```bash
chmod -R 775 cache/
chmod -R 775 tmp/
```

## Features

- User Authentication & Authorization
- Project Management
- Time Logging
- Report Generation
- User Management
- Dashboard Analytics

## Directory Structure

```
├── assets/         # Frontend assets (JS, CSS, images)
├── config/         # Configuration files
├── includes/       # PHP includes and functions
├── pages/          # Page controllers and views
├── public/         # Publicly accessible files
└── cache/          # Cache directory
```

## Security

- All user inputs are sanitized
- Passwords are hashed using PHP's password_hash()
- CSRF protection implemented
- XSS protection through proper escaping
- SQL injection prevention using prepared statements

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 