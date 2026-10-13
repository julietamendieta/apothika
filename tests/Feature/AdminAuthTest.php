<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_login_requires_username_and_password(): void
    {
        User::create([
            'name' => 'Pharmacy Admin',
            'username' => 'farmadmin',
            'email' => 'farmadmin@example.com',
            'password' => bcrypt('secret123'),
            'role' => 'admin',
        ]);

        $this->get('/admin')->assertRedirect('/admin/login');

        $response = $this->post('/admin/login', [
            'username' => 'farmadmin',
            'password' => 'secret123',
        ]);

        $response->assertRedirect('/admin');
        $this->assertAuthenticated();
    }
}
