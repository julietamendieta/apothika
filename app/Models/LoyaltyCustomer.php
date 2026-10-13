<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class LoyaltyCustomer extends Model
{
    protected $fillable = ['user_id', 'qr_code', 'points_balance', 'total_spent', 'is_active'];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $customer): void {
            $customer->qr_code ??= (string) Str::uuid();
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(LoyaltyTransaction::class, 'customer_id');
    }

    public function activityCompletions(): HasMany
    {
        return $this->hasMany(LoyaltyActivityCompletion::class, 'customer_id');
    }

    public function qrUrl(): string
    {
        return 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data='.urlencode($this->qr_code);
    }
}
