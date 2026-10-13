<?php

namespace App\Http\Controllers;

use App\Models\LoyaltyActivityCompletion;
use App\Models\LoyaltyCustomer;
use App\Services\LoyaltyActivityRewardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerActivityCompletionController extends Controller
{
    public function store(Request $request, LoyaltyActivityRewardService $rewardService): JsonResponse
    {
        $validated = $request->validate([
            'activity_type' => ['required', 'string', 'in:advice,trivia'],
            'activity_id' => ['required', 'string', 'max:80'],
        ]);

        $customer = LoyaltyCustomer::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        if (! $customer) {
            return response()->json(['message' => 'Customer QR code was not found.'], 404);
        }

        $correctAnswerIndexes = $rewardService->correctAnswerIndexes(
            $validated['activity_type'],
            $validated['activity_id'],
        );

        if ($correctAnswerIndexes === null) {
            return response()->json(['message' => 'Activity was not found.'], 404);
        }

        $answerData = $request->validate([
            'answers' => ['required', 'array', 'size:'.count($correctAnswerIndexes)],
            'answers.*' => ['required', 'integer', 'between:0,2'],
        ]);
        $pointsAwarded = $rewardService->pointsForAnswers(
            $validated['activity_type'],
            $correctAnswerIndexes,
            $answerData['answers'],
        );

        $completion = DB::transaction(function () use ($customer, $validated, $pointsAwarded): LoyaltyActivityCompletion {
            $completion = LoyaltyActivityCompletion::firstOrCreate(
                [
                    'customer_id' => $customer->id,
                    'activity_type' => $validated['activity_type'],
                    'activity_id' => $validated['activity_id'],
                ],
                ['points_awarded' => $pointsAwarded],
            );

            if ($completion->wasRecentlyCreated && $completion->points_awarded > 0) {
                $customer->increment('points_balance', $completion->points_awarded);
            }

            return $completion;
        });

        return response()->json([
            'activity_type' => $completion->activity_type,
            'activity_id' => $completion->activity_id,
            'points_awarded' => $completion->points_awarded,
            'already_completed' => ! $completion->wasRecentlyCreated,
            'points_balance' => $customer->fresh()->points_balance,
        ]);
    }
}
