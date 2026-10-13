<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_registration_creates_a_profile_and_starts_a_session(): void
    {
        $this->postJson('/customer/register', [
            'name' => 'Marta López',
            'email' => 'marta@example.test',
            'password' => 'secure-password',
            'password_confirmation' => 'secure-password',
            'role' => 'admin',
        ])->assertCreated();

        $customer = User::where('email', 'marta@example.test')->firstOrFail();

        $this->assertAuthenticatedAs($customer);
        $this->assertSame('customer', $customer->role);
        $this->assertDatabaseHas('loyalty_customers', [
            'user_id' => $customer->id,
            'points_balance' => 0,
            'total_spent' => 0,
        ]);

        $this->getJson('/api/customer')
            ->assertOk()
            ->assertJsonPath('name', 'Marta López')
            ->assertJsonPath('points_balance', 0);
    }

    public function test_customer_can_log_in_with_email_and_password(): void
    {
        $customer = User::factory()->create([
            'email' => 'marta@example.test',
            'role' => 'customer',
            'password' => 'secure-password',
        ]);

        $this->postJson('/customer/login', [
            'email' => 'marta@example.test',
            'password' => 'secure-password',
        ])->assertOk();

        $this->assertAuthenticatedAs($customer);
    }

    public function test_admin_account_cannot_log_in_to_the_customer_area(): void
    {
        User::factory()->create([
            'email' => 'admin@example.test',
            'role' => 'admin',
            'password' => 'secure-password',
        ]);

        $this->postJson('/customer/login', [
            'email' => 'admin@example.test',
            'password' => 'secure-password',
        ])->assertUnprocessable();

        $this->assertGuest();
    }

    public function test_guest_cannot_read_customer_profile_or_submit_activity(): void
    {
        $this->getJson('/api/customer')->assertUnauthorized();

        $this->postJson('/api/customer/activity-completions', [
            'activity_type' => 'advice',
            'activity_id' => 'sunscreen',
            'answers' => [0],
        ])->assertUnauthorized();
    }

    public function test_customer_can_log_out_and_loses_access_to_their_profile(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($customer)
            ->postJson('/customer/logout')
            ->assertOk();

        $this->assertGuest();
        $this->getJson('/api/customer')->assertUnauthorized();
    }
}
