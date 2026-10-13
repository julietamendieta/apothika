<?php

namespace App\Services;

use InvalidArgumentException;

class LoyaltyPointsService
{
    public function __construct(private int $pointsPerAmount = 10)
    {
    }

    public function calculatePoints(float $purchaseAmount): int
    {
        if ($purchaseAmount < 0) {
            throw new InvalidArgumentException('Purchase amount cannot be negative.');
        }

        if ($purchaseAmount === 0.0) {
            return 0;
        }

        return (int) floor($purchaseAmount / $this->pointsPerAmount);
    }
}
