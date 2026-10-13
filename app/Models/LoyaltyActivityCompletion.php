<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyActivityCompletion extends Model
{
    protected $fillable = ['customer_id', 'activity_type', 'activity_id', 'points_awarded'];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(LoyaltyCustomer::class);
    }
}
