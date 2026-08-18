<?php
header('Content-Type: application/json; charset=UTF-8');

$host = 'localhost';
$dbname = 'machines';
$username = 'machines';
$password = 'Green#4$Seed';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Add your API endpoints and logic below
$action = $_GET['action'] ?? '';

if ($action === 'test') {
    echo json_encode(['status' => 'success', 'message' => 'Connected successfully']);
}
?>