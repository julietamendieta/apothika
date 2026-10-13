<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\AdminLoginController;
use App\Http\Controllers\Auth\CustomerAuthController;
use App\Http\Controllers\CustomerActivityCompletionController;
use App\Http\Middleware\EnsureAdminAuthenticated;
use App\Models\LoyaltyCustomer;
use App\Models\LoyaltyTransaction;
use App\Models\Pharmacy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('app');
});

Route::prefix('/customer')->group(function (): void {
    Route::post('/register', [CustomerAuthController::class, 'register'])
        ->middleware('throttle:5,1');
    Route::post('/login', [CustomerAuthController::class, 'login'])
        ->middleware('throttle:5,1');
    Route::post('/logout', [CustomerAuthController::class, 'logout'])
        ->middleware('auth');
});

Route::middleware('auth')->group(function (): void {
    Route::get('/api/customer', function (Request $request) {
        $customer = LoyaltyCustomer::with('user')
            ->where('user_id', $request->user()->id)
            ->firstOrFail();
        $pharmacy = Pharmacy::first();

        return response()->json([
            'id' => $customer->id,
            'name' => $customer->user->name,
            'email' => $customer->user->email,
            'points_balance' => $customer->points_balance,
            'total_spent' => $customer->total_spent,
            'qr_code' => $customer->qr_code,
            'qr_url' => $customer->qrUrl(),
            'activity_completions' => $customer->activityCompletions()
                ->get(['activity_type', 'activity_id', 'points_awarded', 'created_at'])
                ->map(fn ($completion): array => [
                    'activity_type' => $completion->activity_type,
                    'activity_id' => $completion->activity_id,
                    'points_awarded' => $completion->points_awarded,
                    'created_at' => $completion->created_at?->toIso8601String(),
                ])
                ->values(),
            'purchase_transactions' => $customer->transactions()
                ->with('pharmacy')
                ->latest()
                ->take(20)
                ->get()
                ->map(fn (LoyaltyTransaction $transaction): array => [
                    'id' => $transaction->id,
                    'pharmacy_name' => $transaction->pharmacy?->name ?? 'Farmacia',
                    'points_earned' => $transaction->points_earned,
                    'created_at' => $transaction->created_at?->toIso8601String(),
                ])
                ->values(),
            'pharmacy' => $pharmacy ? [
                'id' => $pharmacy->id,
                'name' => $pharmacy->name,
                'address' => $pharmacy->address,
            ] : null,
        ]);
    });

    Route::post('/api/customer/activity-completions', [CustomerActivityCompletionController::class, 'store'])
        ->middleware('throttle:30,1');
});

Route::get('/admin/login', [AdminLoginController::class, 'create'])->name('admin.login');
Route::post('/admin/login', [AdminLoginController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('admin.login.store');

Route::middleware(EnsureAdminAuthenticated::class)->group(function (): void {
    Route::get('/admin', [AdminController::class, 'index'])->name('admin.dashboard');
    Route::post('/admin/logout', [AdminLoginController::class, 'destroy'])->name('admin.logout');

    Route::prefix('/api/admin')->group(function (): void {
        Route::get('/summary', [AdminController::class, 'summary']);
        Route::get('/transactions', [AdminController::class, 'transactions']);
        Route::post('/award-points', [AdminController::class, 'awardPoints']);
    });
});
