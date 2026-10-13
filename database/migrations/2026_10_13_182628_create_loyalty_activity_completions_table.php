<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('loyalty_activity_completions')) {
            Schema::create('loyalty_activity_completions', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('customer_id')->constrained('loyalty_customers')->cascadeOnDelete();
                $table->string('activity_type', 20);
                $table->string('activity_id', 80);
                $table->unsignedTinyInteger('points_awarded')->default(0);
                $table->timestamps();
            });
        }

        Schema::table('loyalty_activity_completions', function (Blueprint $table): void {
            $table->unique(
                ['customer_id', 'activity_type', 'activity_id'],
                'activity_completion_unique',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loyalty_activity_completions');
    }
};
