<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;

class PlanController extends Controller
{
    public function index()
    {
        $plans = SubscriptionPlan::orderBy('name')->get();
        return view('superadmin.plans.index', compact('plans'));
    }
}
