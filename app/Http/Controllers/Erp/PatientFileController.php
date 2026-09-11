<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PatientFolder;
use App\Models\PatientFile;
use App\Models\Patient;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PatientFileController extends Controller
{
    public function storeFolder(Request $request, $patientId)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $patient = Patient::where('id', $patientId)->where('tenant_id', $tenantId)->firstOrFail();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        PatientFolder::create([
            'tenant_id' => $tenantId,
            'patient_id' => $patient->id,
            'name' => $validated['name'],
        ]);

        return back()->with('success', 'Carpeta creada.');
    }

    public function destroyFolder(Request $request, $patientId, $folderId)
    {
        $tenantId = $request->attributes->get('tenant_id');
        
        $folder = PatientFolder::where('id', $folderId)
            ->where('tenant_id', $tenantId)
            ->where('patient_id', $patientId)
            ->firstOrFail();

        // Delete all physical files in this folder
        foreach ($folder->files as $file) {
            Storage::disk('local')->delete($file->file_path);
        }

        $folder->delete();

        return back()->with('success', 'Carpeta eliminada.');
    }

    public function storeFile(Request $request, $patientId, $folderId)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $patient = Patient::where('id', $patientId)->where('tenant_id', $tenantId)->firstOrFail();
        
        $folder = PatientFolder::where('id', $folderId)
            ->where('tenant_id', $tenantId)
            ->where('patient_id', $patient->id)
            ->firstOrFail();

        $request->validate([
            'files' => 'required|array',
            'files.*' => 'file|max:10240|mimes:jpg,jpeg,png,pdf', // 10MB max per file
        ]);

        foreach ($request->file('files') as $uploadedFile) {
            $path = $uploadedFile->store("patients/{$patient->id}/{$folder->id}", 'local');

            PatientFile::create([
                'tenant_id' => $tenantId,
                'patient_id' => $patient->id,
                'patient_folder_id' => $folder->id,
                'file_name' => $uploadedFile->getClientOriginalName(),
                'file_path' => $path,
                'file_type' => $uploadedFile->getMimeType(),
                'file_size' => $uploadedFile->getSize(),
            ]);
        }

        return back()->with('success', 'Archivo(s) subido(s).');
    }

    public function destroyFile(Request $request, $patientId, $fileId)
    {
        $tenantId = $request->attributes->get('tenant_id');
        
        $file = PatientFile::where('id', $fileId)
            ->where('tenant_id', $tenantId)
            ->where('patient_id', $patientId)
            ->firstOrFail();

        Storage::disk('local')->delete($file->file_path);
        $file->delete();

        return back()->with('success', 'Archivo eliminado.');
    }

    public function download(Request $request, $patientId, $fileId)
    {
        $tenantId = $request->attributes->get('tenant_id');
        
        $file = PatientFile::where('id', $fileId)
            ->where('tenant_id', $tenantId)
            ->where('patient_id', $patientId)
            ->firstOrFail();

        if (!Storage::disk('local')->exists($file->file_path)) {
            abort(404, 'Archivo no encontrado');
        }

        // Return inline to allow viewing in browser
        return response()->file(Storage::disk('local')->path($file->file_path), [
            'Content-Type' => $file->file_type,
            'Content-Disposition' => 'inline; filename="' . $file->file_name . '"',
        ]);
    }
}
