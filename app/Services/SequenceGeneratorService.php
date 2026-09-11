<?php

namespace App\Services;

class SequenceGeneratorService
{
    /**
     * Generate the next guaranteed unique sequence number for a given tenant, model, and column.
     *
     * Example formats:
     * - ASI-00001
     * - GAS-00001
     * - FAC-00001
     * - PRES-00001
     *
     * @param string $tenantId
     * @param string $modelClass Model class string (e.g. AccountingEntry::class)
     * @param string $column Column name (e.g. 'entry_number', 'expense_number', 'invoice_number')
     * @param string $prefix Prefix (e.g. 'ASI', 'GAS', 'FAC', 'PRES')
     * @param int $padLength Number of digits (default: 5)
     * @return string
     */
    public static function generateNext(
        string $tenantId,
        string $modelClass,
        string $column,
        string $prefix,
        int $padLength = 5
    ): string {
        // Fetch candidates matching the prefix pattern for this tenant
        // We order by string length and then value descending to prioritize the highest numbers
        $candidates = $modelClass::where('tenant_id', $tenantId)
            ->where($column, 'like', "{$prefix}-%")
            ->orderByRaw("LENGTH({$column}) DESC")
            ->orderBy($column, 'desc')
            ->limit(100)
            ->pluck($column);

        $max = 0;
        foreach ($candidates as $val) {
            if (preg_match('/^' . preg_quote($prefix, '/') . '-(\d+)$/', (string) $val, $matches)) {
                $num = (int) $matches[1];
                if ($num > $max) {
                    $max = $num;
                }
            }
        }

        $nextNum = $max + 1;
        $generated = $prefix . '-' . str_pad((string) $nextNum, $padLength, '0', STR_PAD_LEFT);

        // Safeguard loop: verify that the generated code does not collide with existing records
        while ($modelClass::where('tenant_id', $tenantId)->where($column, $generated)->exists()) {
            $nextNum++;
            $generated = $prefix . '-' . str_pad((string) $nextNum, $padLength, '0', STR_PAD_LEFT);
        }

        return $generated;
    }
}
