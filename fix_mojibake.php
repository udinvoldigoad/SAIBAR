<?php
$dir = __DIR__ . '/frontend/src';
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));

$replacements = [
    'â€”' => '—',
    'â€¦' => '…',
    'âš ï¸ ' => '⚠️',
    'â†’' => '→',
    'Â·' => '·',
    'Â±' => '±',
    'Â©' => '©',
    'âœ“' => '✓',
    'â€“' => '–',
    'â€˜' => '‘',
    'â€™' => '’',
    'â€œ' => '“',
    'â€' => '”',
];

$search = array_keys($replacements);
$replace = array_values($replacements);

$count = 0;
foreach ($iterator as $file) {
    if ($file->isFile() && in_array($file->getExtension(), ['ts', 'tsx', 'css'])) {
        $path = $file->getPathname();
        $content = file_get_contents($path);
        
        $newContent = str_replace($search, $replace, $content);
        
        if ($newContent !== $content) {
            file_put_contents($path, $newContent);
            echo "Fixed: " . $path . "\n";
            $count++;
        }
    }
}

echo "Total files fixed: $count\n";
