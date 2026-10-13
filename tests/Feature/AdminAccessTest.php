<?php

namespace Tests\Feature;

use App\Models\LoyaltyCustomer;
use App\Models\Pharmacy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_sign_in_with_username_and_password(): void
    {
        $admin = User::factory()->create([
            'username' => 'pharmacy-admin',
            'role' => 'admin',
        ]);

        $this->post('/admin/login', [
            'username' => 'pharmacy-admin',
            'password' => 'password',
        ])->assertRedirect(route('admin.dashboard'));

        $this->assertAuthenticatedAs($admin);
    }

    public function test_non_admin_cannot_sign_in_to_the_staff_portal(): void
    {
        User::factory()->create([
            'username' => 'customer-user',
            'role' => 'customer',
        ]);

        $this->from('/admin/login')->post('/admin/login', [
            'username' => 'customer-user',
            'password' => 'password',
        ])->assertRedirect('/admin/login')->assertSessionHasErrors('username');
    }

    public function test_admin_dashboard_redirects_unauthenticated_visitors(): void
    {
        $this->get('/admin')->assertRedirect(route('admin.login'));
    }

    public function test_admin_api_returns_401_to_unauthenticated_requests(): void
    {
        $this->getJson('/api/admin/summary')->assertUnauthorized();
    }

    public function test_admin_api_returns_403_to_authenticated_customers(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($customer)
            ->getJson('/api/admin/summary')
            ->assertForbidden();
    }

    public function test_awarded_transaction_uses_the_signed_in_admin(): void
    {
        $admin = User::factory()->create([
            'username' => 'pharmacy-admin',
            'role' => 'admin',
        ]);
        $customerUser = User::factory()->create();
        $customer = LoyaltyCustomer::create([
            'user_id' => $customerUser->id,
            'qr_code' => 'customer-qr-001',
            'points_balance' => 0,
            'total_spent' => 0,
        ]);
        Pharmacy::create(['name' => 'Farmacia de prueba']);

        $this->actingAs($admin)->postJson('/api/admin/award-points', [
            'qr_code' => $customer->qr_code,
            'amount' => 150,
            'admin_id' => 999,
        ])->assertOk()->assertJsonPath('points_earned', 15);

        $this->assertDatabaseHas('loyalty_transactions', [
            'customer_id' => $customer->id,
            'admin_id' => $admin->id,
            'amount' => 150,
            'points_earned' => 15,
        ]);
        $this->assertDatabaseMissing('loyalty_transactions', ['admin_id' => 999]);
    }
}
