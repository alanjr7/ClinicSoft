<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\DemoLead;

class DemoLeadController extends Controller
{
    public function index()
    {
        $leads = DemoLead::orderByDesc('created_at')->get();

        return Inertia::render('superadmin/DemoLeads', [
            'leads' => $leads,
        ]);
    }

    public function destroy($id)
    {
        $lead = DemoLead::findOrFail($id);
        $lead->delete();

        return back()->with('success', 'Registro de modo demo eliminado exitosamente.');
    }
}
