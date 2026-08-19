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

try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS process_records (
        id VARCHAR(80) PRIMARY KEY,
        record_data JSON NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_process_records_updated_at (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->query('SELECT record_data FROM process_records ORDER BY updated_at DESC');
        $records = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $record = json_decode($row['record_data'], true);
            if (is_array($record) && !empty($record['id'])) $records[] = $record;
        }
        echo json_encode($records, JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $record = json_decode(file_get_contents('php://input'), true);
        if (!is_array($record) || empty($record['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'A record with an id is required']);
            exit;
        }

        $createdAt = date('Y-m-d H:i:s', strtotime($record['createdAt'] ?? 'now'));
        $updatedAt = date('Y-m-d H:i:s', strtotime($record['updatedAt'] ?? 'now'));
        $stmt = $pdo->prepare('INSERT IGNORE INTO process_records (id, record_data, created_at, updated_at) VALUES (:id, :data, :created_at, :updated_at)');
        $stmt->execute([
            ':id' => (string) $record['id'],
            ':data' => json_encode($record, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            ':created_at' => $createdAt,
            ':updated_at' => $updatedAt
        ]);
        echo json_encode(['status' => 'saved', 'id' => $record['id']]);
        exit;
    }

    $action = $_GET['action'] ?? '';
    if ($action === 'test') {
        echo json_encode(['status' => 'success', 'message' => 'Connected successfully']);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'API operation failed: ' . $e->getMessage()]);
}
?>