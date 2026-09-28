<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Area;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\Patient;
use App\Models\Appointment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Crypt;

class AreaManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected Tenant $tenantA;
    protected Tenant $tenantB;
    protected Tenant $tenantC;

    protected function setUp(): void
    {
        parent::setUp();

        // Create SuperAdmin
        $this->superAdmin = User::create([
            'first_name'  => 'Super',
            'last_name'   => 'Admin',
            'email'       => 'superadmin@dentalsoft.app',
            'password'    => Hash::make('password123'),
            'global_role' => 'superadmin',
            'is_active'   => true,
        ]);

        // Create a Subscription Plan
        $plan = \App\Models\SubscriptionPlan::create([
            'tier'          => 'premium',
            'name'          => 'Plan Premium',
            'max_users'     => 10,
            'max_patients'  => 500,
            'price_monthly' => 50,
        ]);

        // Create Tenants (Clinics)
        $this->tenantA = Tenant::create([
            'plan_id'  => $plan->id,
            'name'     => 'Clínica Norte',
            'slug'     => 'clinica-norte',
            'email'    => 'norte@dental.app',
            'status'   => 'active',
            'currency' => 'Bs.',
        ]);

        $this->tenantB = Tenant::create([
            'plan_id'  => $plan->id,
            'name'     => 'Clínica Sur',
            'slug'     => 'clinica-sur',
            'email'    => 'sur@dental.app',
            'status'   => 'active',
            'currency' => 'Bs.',
        ]);

        $this->tenantC = Tenant::create([
            'plan_id'  => $plan->id,
            'name'     => 'Clínica Independiente Externa',
            'slug'     => 'clinica-externa',
            'email'    => 'externa@dental.app',
            'status'   => 'active',
            'currency' => 'Bs.',
        ]);
    }

    /**
     * Test 1: SuperAdmin can create an Area with assigned clinics
     */
    public function test_superadmin_can_create_area_with_assigned_clinics(): void
    {
        $response = $this->actingAs($this->superAdmin)->post('/superadmin/areas', [
            'name'       => 'Red Dental Central',
            'phone'      => '+591 71234567',
            'email'      => 'central@reddental.app',
            'password'   => 'area_pass_123',
            'tenant_ids' => [$this->tenantA->id, $this->tenantB->id],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        // Assert Area exists in DB
        $this->assertDatabaseHas('areas', [
            'name'      => 'Red Dental Central',
            'email'     => 'central@reddental.app',
            'phone'     => '+591 71234567',
            'is_active' => true,
        ]);

        // Assert User with global_role 'area' was created
        $this->assertDatabaseHas('users', [
            'email'       => 'central@reddental.app',
            'global_role' => 'area',
            'is_active'   => true,
        ]);

        $area = Area::where('email', 'central@reddental.app')->first();
        $this->assertNotNull($area);
        $this->assertCount(2, $area->tenants);
        $this->assertTrue($area->tenants->contains($this->tenantA));
        $this->assertTrue($area->tenants->contains($this->tenantB));
        $this->assertFalse($area->tenants->contains($this->tenantC));
    }

    /**
     * Test 2: SuperAdmin can update an Area and sync clinics
     */
    public function test_superadmin_can_update_area(): void
    {
        $areaUser = User::create([
            'first_name'  => 'Red',
            'last_name'   => 'Dental',
            'email'       => 'test@reddental.app',
            'password'    => Hash::make('123456'),
            'global_role' => 'area',
            'is_active'   => true,
        ]);

        $area = Area::create([
            'user_id'   => $areaUser->id,
            'name'      => 'Red Dental Antigua',
            'phone'     => '123',
            'email'     => 'test@reddental.app',
            'is_active' => true,
        ]);
        $area->tenants()->sync([$this->tenantA->id]);

        $response = $this->actingAs($this->superAdmin)->put("/superadmin/areas/{$area->id}", [
            'name'       => 'Red Dental Actualizada',
            'phone'      => '77788899',
            'email'      => 'test_updated@reddental.app',
            'is_active'  => true,
            'tenant_ids' => [$this->tenantB->id, $this->tenantC->id],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $area->refresh();
        $this->assertEquals('Red Dental Actualizada', $area->name);
        $this->assertEquals('test_updated@reddental.app', $area->email);
        $this->assertCount(2, $area->tenants);
        $this->assertTrue($area->tenants->contains($this->tenantB));
        $this->assertTrue($area->tenants->contains($this->tenantC));
        $this->assertFalse($area->tenants->contains($this->tenantA));
    }

    /**
     * Test 3: Area User Login and Redirection
     */
    public function test_area_user_logs_in_and_redirects_to_area_dashboard(): void
    {
        $password = 'secret1234';
        $areaUser = User::create([
            'first_name'         => 'Doctor',
            'last_name'          => 'Líder',
            'email'              => 'lider@area.com',
            'password'           => Hash::make($password),
            'encrypted_password' => Crypt::encryptString($password),
            'global_role'        => 'area',
            'is_active'          => true,
        ]);

        $area = Area::create([
            'user_id'   => $areaUser->id,
            'name'      => 'Área Sanitaria Metropolitana',
            'email'     => 'lider@area.com',
            'is_active' => true,
        ]);
        $area->tenants()->sync([$this->tenantA->id, $this->tenantB->id]);

        $response = $this->post('/login', [
            'email'    => 'lider@area.com',
            'password' => $password,
        ]);

        $response->assertRedirect(route('area.dashboard'));
        $this->assertAuthenticatedAs($areaUser);

        // Access Area Dashboard
        $dashResponse = $this->actingAs($areaUser)->get('/area/dashboard');
        $dashResponse->assertOk();

        // Access Area Reports
        $repResponse = $this->actingAs($areaUser)->get('/area/reports');
        $repResponse->assertOk();

        // Access Area Clinics
        $clinicsResponse = $this->actingAs($areaUser)->get('/area/clinics');
        $clinicsResponse->assertOk();
    }

    /**
     * Test 4: Regular Clinic user cannot access Area panel
     */
    public function test_regular_clinic_user_cannot_access_area_panel(): void
    {
        $regularUser = User::create([
            'first_name'  => 'Dentista',
            'last_name'   => 'Local',
            'email'       => 'dentist@norte.app',
            'password'    => Hash::make('pass123'),
            'global_role' => 'regular',
            'is_active'   => true,
        ]);

        TenantUser::create([
            'tenant_id' => $this->tenantA->id,
            'user_id'   => $regularUser->id,
            'role'      => 'admin',
            'is_active' => true,
        ]);

        $response = $this->actingAs($regularUser)->get('/area/dashboard');
        $response->assertForbidden();
    }

    /**
     * Test 5: Clinic Impersonation & Return flow
     */
    public function test_area_user_can_impersonate_assigned_clinic_and_return(): void
    {
        $areaUser = User::create([
            'first_name'  => 'Director',
            'last_name'   => 'Área',
            'email'       => 'director@areagroup.com',
            'password'    => Hash::make('pass123'),
            'global_role' => 'area',
            'is_active'   => true,
        ]);

        $area = Area::create([
            'user_id'   => $areaUser->id,
            'name'      => 'Grupo Odontológico',
            'email'     => 'director@areagroup.com',
            'is_active' => true,
        ]);
        $area->tenants()->sync([$this->tenantA->id]);

        // 1. Impersonate Tenant A (Assigned)
        $impersonateResponse = $this->actingAs($areaUser)->post("/area/clinics/{$this->tenantA->id}/impersonate");
        $impersonateResponse->assertRedirect(route('dashboard'));
        $this->assertEquals($this->tenantA->id, session('area_impersonated_tenant_id'));

        // 2. Access ERP Dashboard as impersonator
        $erpResponse = $this->actingAs($areaUser)->get('/dashboard');
        $erpResponse->assertOk();

        // 3. Exit Impersonation
        $exitResponse = $this->actingAs($areaUser)->post('/area/exit-impersonation');
        $exitResponse->assertRedirect(route('area.clinics.index'));
        $this->assertNull(session('area_impersonated_tenant_id'));
    }

    /**
     * Test 6: Area user cannot impersonate unassigned clinic
     */
    public function test_area_user_cannot_impersonate_unassigned_clinic(): void
    {
        $areaUser = User::create([
            'first_name'  => 'Director',
            'last_name'   => 'Área',
            'email'       => 'dir@area.com',
            'password'    => Hash::make('pass123'),
            'global_role' => 'area',
            'is_active'   => true,
        ]);

        $area = Area::create([
            'user_id'   => $areaUser->id,
            'name'      => 'Área A',
            'email'     => 'dir@area.com',
            'is_active' => true,
        ]);
        // Only assign tenantA
        $area->tenants()->sync([$this->tenantA->id]);

        // Try to impersonate tenantC (Not assigned)
        $response = $this->actingAs($areaUser)->post("/area/clinics/{$this->tenantC->id}/impersonate");
        $response->assertNotFound();
    }
}
