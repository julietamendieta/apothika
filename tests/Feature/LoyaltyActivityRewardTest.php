<?php

namespace Tests\Feature;

use App\Models\LoyaltyCustomer;
use App\Models\LoyaltyTransaction;
use App\Models\Pharmacy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class LoyaltyActivityRewardTest extends TestCase
{
    use RefreshDatabase;

    public function test_trivia_awards_five_points_per_correct_answer_only_once(): void
    {
        $customer = $this->createCustomer();
        $this->actingAs($customer->user);
        $payload = [
            'activity_type' => 'trivia',
            'activity_id' => 'antibiotics-myths',
            'answers' => [0, 1, 0],
            'points_awarded' => 999,
        ];

        $this->postJson('/api/customer/activity-completions', $payload)
            ->assertOk()
            ->assertJsonPath('points_awarded', 15)
            ->assertJsonPath('points_balance', 25)
            ->assertJsonPath('already_completed', false);

        $this->postJson('/api/customer/activity-completions', [...$payload, 'answers' => [0, 0, 0]])
            ->assertOk()
            ->assertJsonPath('points_awarded', 15)
            ->assertJsonPath('points_balance', 25)
            ->assertJsonPath('already_completed', true);

        $this->assertDatabaseCount('loyalty_activity_completions', 1);
        $this->assertDatabaseHas('loyalty_customers', [
            'id' => $customer->id,
            'points_balance' => 25,
        ]);
    }

    public function test_trivia_awards_only_five_points_for_one_correct_answer(): void
    {
        $customer = $this->createCustomer();
        $this->actingAs($customer->user);

        $this->postJson('/api/customer/activity-completions', [
            'activity_type' => 'trivia',
            'activity_id' => 'antibiotics-myths',
            'answers' => [0, 0, 1],
        ])->assertOk()->assertJsonPath('points_awarded', 5)->assertJsonPath('points_balance', 15);
    }

    public static function remainingTriviaAnswerKeys(): array
    {
        return [
            'healthy sleep' => ['healthy-sleep', [1, 0, 0]],
            'responsible medicines' => ['responsible-medicines', [1, 0, 0]],
        ];
    }

    #[DataProvider('remainingTriviaAnswerKeys')]
    public function test_each_trivia_uses_its_own_answer_key(string $activityId, array $answers): void
    {
        $customer = $this->createCustomer();
        $this->actingAs($customer->user);

        $this->postJson('/api/customer/activity-completions', [
            'activity_type' => 'trivia',
            'activity_id' => $activityId,
            'answers' => $answers,
        ])->assertOk()->assertJsonPath('points_awarded', 15);
    }

    public function test_correct_advice_answer_awards_three_points_and_is_not_repeatable(): void
    {
        $customer = $this->createCustomer();
        $this->actingAs($customer->user);
        $payload = [
            'activity_type' => 'advice',
            'activity_id' => 'sunscreen',
            'answers' => [0],
        ];

        $this->postJson('/api/customer/activity-completions', $payload)
            ->assertOk()
            ->assertJsonPath('points_awarded', 3)
            ->assertJsonPath('points_balance', 13);

        $this->postJson('/api/customer/activity-completions', [...$payload, 'answers' => [1]])
            ->assertOk()
            ->assertJsonPath('points_awarded', 3)
            ->assertJsonPath('points_balance', 13)
            ->assertJsonPath('already_completed', true);

        $this->getJson('/api/customer')
            ->assertOk()
            ->assertJsonPath('activity_completions.0.activity_type', 'advice')
            ->assertJsonPath('activity_completions.0.activity_id', 'sunscreen')
            ->assertJsonPath('activity_completions.0.points_awarded', 3);
    }

    public function test_customer_points_api_includes_purchase_and_activity_rewards(): void
    {
        $customer = $this->createCustomer();
        $this->actingAs($customer->user);
        $customer->update(['points_balance' => 15]);
        $pharmacy = Pharmacy::create(['name' => 'Farmacia de prueba']);

        LoyaltyTransaction::create([
            'customer_id' => $customer->id,
            'pharmacy_id' => $pharmacy->id,
            'admin_id' => null,
            'amount' => 50,
            'points_earned' => 5,
            'points_balance_after' => 15,
            'description' => 'Purchase points awarded',
        ]);

        $this->postJson('/api/customer/activity-completions', [
            'qr_code' => $customer->qr_code,
            'activity_type' => 'advice',
            'activity_id' => 'sunscreen',
            'answers' => [0],
        ])->assertOk();

        $this->getJson('/api/customer')
            ->assertOk()
            ->assertJsonPath('purchase_transactions.0.pharmacy_name', 'Farmacia de prueba')
            ->assertJsonPath('purchase_transactions.0.points_earned', 5)
            ->assertJsonPath('activity_completions.0.activity_id', 'sunscreen')
            ->assertJsonPath('activity_completions.0.points_awarded', 3);
    }

    public function test_incorrect_advice_answer_completes_without_awarding_points(): void
    {
        $customer = $this->createCustomer();
        $this->actingAs($customer->user);
        $payload = [
            'activity_type' => 'advice',
            'activity_id' => 'sunscreen',
            'answers' => [2],
        ];

        $this->postJson('/api/customer/activity-completions', $payload)
            ->assertOk()
            ->assertJsonPath('points_awarded', 0)
            ->assertJsonPath('points_balance', 10);

        $this->postJson('/api/customer/activity-completions', [...$payload, 'answers' => [0]])
            ->assertOk()
            ->assertJsonPath('points_awarded', 0)
            ->assertJsonPath('points_balance', 10)
            ->assertJsonPath('already_completed', true);
    }

    public static function remainingAdviceAnswerKeys(): array
    {
        return [
            'home first aid' => ['home-first-aid', 1],
            'balanced plate' => ['balanced-plate', 1],
            'healthy sleep' => ['healthy-sleep', 1],
            'safe medicine' => ['safe-medicine', 0],
        ];
    }

    #[DataProvider('remainingAdviceAnswerKeys')]
    public function test_each_advice_uses_its_own_answer_key(string $activityId, int $answer): void
    {
        $customer = $this->createCustomer();
        $this->actingAs($customer->user);

        $this->postJson('/api/customer/activity-completions', [
            'activity_type' => 'advice',
            'activity_id' => $activityId,
            'answers' => [$answer],
        ])->assertOk()->assertJsonPath('points_awarded', 3);
    }

    public function test_unknown_activity_returns_404_without_awarding_points(): void
    {
        $customer = $this->createCustomer();
        $this->actingAs($customer->user);

        $this->postJson('/api/customer/activity-completions', [
            'activity_type' => 'trivia',
            'activity_id' => 'not-a-real-activity',
            'answers' => [0],
        ])->assertNotFound();

        $this->assertDatabaseMissing('loyalty_activity_completions', [
            'customer_id' => $customer->id,
        ]);
    }

    public function test_activity_rejects_an_answer_count_that_does_not_match_the_quiz(): void
    {
        $customer = $this->createCustomer();
        $this->actingAs($customer->user);

        $this->postJson('/api/customer/activity-completions', [
            'activity_type' => 'trivia',
            'activity_id' => 'antibiotics-myths',
            'answers' => [0],
        ])->assertUnprocessable()->assertJsonValidationErrors('answers');

        $this->assertDatabaseCount('loyalty_activity_completions', 0);
    }

    public function test_activity_reward_is_bound_to_the_authenticated_customer_not_a_submitted_qr(): void
    {
        $authenticatedCustomer = $this->createCustomer();
        $otherCustomer = $this->createCustomer();
        $this->actingAs($authenticatedCustomer->user);

        $this->postJson('/api/customer/activity-completions', [
            'qr_code' => $otherCustomer->qr_code,
            'activity_type' => 'advice',
            'activity_id' => 'sunscreen',
            'answers' => [0],
        ])->assertOk()->assertJsonPath('points_balance', 13);

        $this->assertDatabaseHas('loyalty_customers', [
            'id' => $authenticatedCustomer->id,
            'points_balance' => 13,
        ]);
        $this->assertDatabaseHas('loyalty_customers', [
            'id' => $otherCustomer->id,
            'points_balance' => 10,
        ]);
    }

    private function createCustomer(): LoyaltyCustomer
    {
        $user = User::factory()->create();

        return LoyaltyCustomer::create([
            'user_id' => $user->id,
            'qr_code' => 'activity-test-'.$user->id,
            'points_balance' => 10,
            'total_spent' => 0,
        ]);
    }
}
