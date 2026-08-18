<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$host = 'localhost';
$db   = 'YOUR_DB_NAME';
$user = 'YOUR_DB_USER';
$pass = 'YOUR_DB_PASS';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

$pdo->exec("CREATE TABLE IF NOT EXISTS factory_records (
    id VARCHAR(255) PRIMARY KEY,
    updated_at VARCHAR(255),
    payload LONGTEXT
)");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT payload FROM factory_records");
    $rows = $stmt->fetchAll();
    $records = [];
    foreach ($rows as $row) {
        $records[] = json_decode($row['payload']);
    }
    echo json_encode($records);
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (is_array($input) && isset($input[0])) {
        $stmt = $pdo->prepare("REPLACE INTO factory_records (id, updated_at, payload) VALUES (?, ?, ?)");
        foreach ($input as $item) {
            if (isset($item['id'])) {
                $stmt->execute([$item['id'], $item['updatedAt'] ?? date('c'), json_encode($item)]);
            }
        }
        echo json_encode(['success' => true]);
    } elseif (isset($input['id'])) {
        $stmt = $pdo->prepare("REPLACE INTO factory_records (id, updated_at, payload) VALUES (?, ?, ?)");
        $stmt->execute([$input['id'], $input['updated_at'] ?? date('c'), json_encode($input)]);
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Invalid data format']);
    }
}
?>
