<?php

namespace Tests\Feature;

use App\Services\LoyaltyPointsService;
use InvalidArgumentException;
use Tests\TestCase;

class LoyaltyPointsTest extends TestCase
{
    public function test_it_calculates_points_from_purchase_amount(): void
    {
        $service = new LoyaltyPointsService();

        $this->assertSame(15, $service->calculatePoints(150));
        $this->assertSame(30, $service->calculatePoints(300));
    }

    public function test_it_rejects_negative_purchase_amount(): void
    {
        $this->expectException(InvalidArgumentException::class);

        (new LoyaltyPointsService())->calculatePoints(-10);
    }
}
