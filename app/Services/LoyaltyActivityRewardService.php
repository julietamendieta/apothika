<?php

namespace App\Services;

class LoyaltyActivityRewardService
{
    /**
     * @var array<string, array<string, list<int>>>
     */
    private const ANSWER_KEYS = [
        'trivia' => [
            'antibiotics-myths' => [0, 1, 0],
            'healthy-sleep' => [1, 0, 0],
            'responsible-medicines' => [1, 0, 0],
        ],
        'advice' => [
            'sunscreen' => [0],
            'home-first-aid' => [1],
            'balanced-plate' => [1],
            'healthy-sleep' => [1],
            'safe-medicine' => [0],
        ],
    ];

    /**
     * @return list<int>|null
     */
    public function correctAnswerIndexes(string $activityType, string $activityId): ?array
    {
        return self::ANSWER_KEYS[$activityType][$activityId] ?? null;
    }

    /**
     * @param  list<int>  $correctAnswerIndexes
     * @param  list<int>  $answers
     */
    public function pointsForAnswers(string $activityType, array $correctAnswerIndexes, array $answers): int
    {
        $correctCount = 0;

        foreach ($correctAnswerIndexes as $questionIndex => $correctAnswerIndex) {
            if ((int) $answers[$questionIndex] === $correctAnswerIndex) {
                $correctCount++;
            }
        }

        if ($activityType === 'advice') {
            return $correctCount === 1 ? 3 : 0;
        }

        return $correctCount * 5;
    }
}
