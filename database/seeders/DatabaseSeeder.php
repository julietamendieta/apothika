<?php

namespace Database\Seeders;

use App\Models\LoyaltyCustomer;
use App\Models\Pharmacy;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::where('username', 'admin')->firstOrNew(['email' => 'admin@apothika.test']);

        $admin->fill([
            'name' => 'Farmacia Admin',
            'username' => 'admin',
            'email' => 'admin@apothika.test',
            'password' => 'password',
            'role' => 'admin',
        ])->save();

        $pharmacy = Pharmacy::firstOrCreate(['name' => 'Farmacia Verde'], [
            'address' => 'Calle San Martín 245',
            'phone' => '+54 11 4455-9080',
            'is_active' => true,
        ]);

        $customer = User::where('name', 'Ana García')->firstOrNew(['email' => 'ana@apothika.test']);

        if (! $customer->exists) {
            $customer->password = 'password';
        }

        $customer->fill([
            'name' => 'Ana García',
            'email' => 'ana@apothika.test',
        ])->save();

        $loyaltyCustomer = LoyaltyCustomer::firstOrNew(['user_id' => $customer->id]);

        if (! $loyaltyCustomer->exists) {
            $loyaltyCustomer->points_balance = 125;
            $loyaltyCustomer->total_spent = 1250;
            $loyaltyCustomer->is_active = true;
        }

        $loyaltyCustomer->qr_code = 'apothika-customer-demo-001';
        $loyaltyCustomer->save();
    }
}
