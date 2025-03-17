<?php
// Load environment variables from .env file
$envFile = __DIR__ . '/.env';
$env = [];

// Set default headers for security
header('Content-Type: application/javascript');
header('X-Content-Type-Options: nosniff');

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines !== false) {
        foreach ($lines as $line) {
            // Skip comments and empty lines
            if (strpos(trim($line), '#') === 0 || empty(trim($line))) {
                continue;
            }

            // Parse environment variables
            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);
                
                // Remove quotes if present
                if (strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) {
                    $value = substr($value, 1, -1);
                } elseif (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1) {
                    $value = substr($value, 1, -1);
                }
                
                $env[$name] = $value;
            }
        }
        echo "// Environment variables loaded from .env file\n";
    } else {
        error_log("Failed to read .env file");
        echo "// Failed to read .env file\n";
    }
} else {
    error_log(".env file not found at " . $envFile);
    echo "// .env file not found, using default values\n";
}
?>
// Environment variables loaded
window.ENV = {
    <?php foreach ($env as $key => $value): ?>
    "<?php echo $key; ?>": "<?php echo addslashes($value); ?>",
    <?php endforeach; ?>
};

// Verify that required variables exist
if (window.ENV.SUPABASE_URL && window.ENV.SUPABASE_ANON_KEY) {
    console.log('Environment variables loaded successfully');
} else {
    console.warn('Some environment variables are missing, falling back to default values');
} 