<?php

namespace App\Http\Controllers;

use App\Models\LoyaltyCustomer;
use App\Models\LoyaltyTransaction;
use App\Models\Pharmacy;
use App\Services\LoyaltyPointsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class AdminController extends Controller
{
    public function index(): View
    {
        return view('admin.dashboard');
    }

    public function summary(): JsonResponse
    {
        return response()->json([
            'customer_count' => LoyaltyCustomer::count(),
            'total_points' => LoyaltyCustomer::sum('points_balance'),
            'pharmacy_name' => Pharmacy::first()?->name ?? 'Farmacia',
        ]);
    }

    public function transactions(): JsonResponse
    {
        return response()->json(
            LoyaltyTransaction::with(['customer.user', 'pharmacy', 'admin'])
                ->latest()
                ->take(10)
                ->get()
                ->map(function (LoyaltyTransaction $transaction): array {
                    return [
                        'id' => $transaction->id,
                        'customer_name' => $transaction->customer?->user?->name ?? 'Cliente',
                        'amount' => (float) $transaction->amount,
                        'points_earned' => $transaction->points_earned,
                        'points_balance_after' => $transaction->points_balance_after,
                        'pharmacy_name' => $transaction->pharmacy?->name ?? 'Farmacia',
                        'created_at' => $transaction->created_at->format('d/m/Y H:i'),
                    ];
                })
        );
    }

    public function awardPoints(Request $request, LoyaltyPointsService $pointsService): JsonResponse
    {
        $validated = $request->validate([
            'qr_code' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'min:0'],
        ]);

        $customer = LoyaltyCustomer::where('qr_code', $validated['qr_code'])->first();

        if (! $customer) {
            return response()->json(['message' => 'Customer QR code was not found.'], 404);
        }

        $pharmacy = Pharmacy::firstOrFail();
        $amount = (float) $validated['amount'];
        $pointsEarned = $pointsService->calculatePoints($amount);

        $transaction = DB::transaction(function () use ($customer, $pharmacy, $amount, $pointsEarned, $request): LoyaltyTransaction {
            $customer->points_balance += $pointsEarned;
            $customer->total_spent += $amount;
            $customer->save();

            return LoyaltyTransaction::create([
                'customer_id' => $customer->id,
                'pharmacy_id' => $pharmacy->id,
                'admin_id' => $request->user()->id,
                'amount' => $amount,
                'points_earned' => $pointsEarned,
                'points_balance_after' => $customer->points_balance,
                'description' => 'Purchase points awarded',
            ]);
        });

        return response()->json([
            'message' => 'Points added successfully.',
            'customer_name' => $customer->user->name,
            'amount' => $amount,
            'points_earned' => $pointsEarned,
            'new_balance' => $customer->points_balance,
            'transaction_id' => $transaction->id,
        ]);
    }
}
