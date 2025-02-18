<?php
session_start();
require_once 'config/database.php';
require_once 'includes/auth.php';

$page = isset($_GET['page']) ? $_GET['page'] : 'dashboard';
$action = isset($_GET['action']) ? $_GET['action'] : 'index';

// Handle routing
$route = "pages/{$page}/{$action}.php";
if (file_exists($route)) {
    require_once $route;
} else {
    header("HTTP/1.0 404 Not Found");
    require_once 'pages/errors/404.php';
}
?> 