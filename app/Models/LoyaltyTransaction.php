<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyTransaction extends Model
{
    protected $fillable = ['customer_id', 'pharmacy_id', 'admin_id', 'amount', 'points_earned', 'points_balance_after', 'description'];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(LoyaltyCustomer::class, 'customer_id');
    }

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class, 'pharmacy_id');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
