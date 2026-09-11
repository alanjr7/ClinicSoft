<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class UserController extends Controller
{
    public function index()
    {
        $users = User::orderBy('last_name')->get(['id', 'first_name', 'last_name', 'email', 'global_role', 'is_active', 'created_at']);
        return view('superadmin.users.index', compact('users'));
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $validated = $request->validate([
            'email'      => 'email|unique:users,email,'.$id,
            'first_name' => 'string|max:100',
            'last_name'  => 'string|max:100',
            'is_active'  => 'boolean',
        ]);
        $user->update($validated);
        return back()->with('success', 'Usuario actualizado.');
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->is_active = false;
        $user->save();
        return back()->with('success', 'Usuario desactivado.');
    }
}
