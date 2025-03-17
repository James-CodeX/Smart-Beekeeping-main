<?php
// Load environment variables from .env file
$envFile = __DIR__ . '/.env';
$env = [];

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments and empty lines
        if (strpos(trim($line), '#') === 0 || empty(trim($line))) {
            continue;
        }

        // Parse environment variables
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        $env[$name] = $value;
    }
}

// Output JavaScript that sets environment variables
header('Content-Type: application/javascript');
?>
// Environment variables loaded from .env
window.ENV = {
    <?php foreach ($env as $key => $value): ?>
    "<?php echo $key; ?>": "<?php echo addslashes($value); ?>",
    <?php endforeach; ?>
};
console.log('Environment variables loaded successfully'); 