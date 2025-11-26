#!/bin/bash
# Script to systematically fix TypeScript errors

echo "🔧 Fixing TypeScript errors..."

# Add Promise<void> return types to controller functions
find src/controllers -name "*.ts" -exec sed -i 's/async \(\w\+\)(\(.*NextFunction\)) {/async \1(\2): Promise<void> {/g' {} \;

echo "✅ Fixed controller return types"
