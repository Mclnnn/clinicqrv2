<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visit_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('visit_logs', 'scan_latitude')) {
                $table->decimal('scan_latitude', 10, 7)->nullable()->after('qr_scanned');
            }
            if (!Schema::hasColumn('visit_logs', 'scan_longitude')) {
                $table->decimal('scan_longitude', 10, 7)->nullable()->after('scan_latitude');
            }
            if (!Schema::hasColumn('visit_logs', 'scan_accuracy')) {
                $table->decimal('scan_accuracy', 10, 2)->nullable()->after('scan_longitude');
            }
            if (!Schema::hasColumn('visit_logs', 'scan_location_status')) {
                $table->string('scan_location_status')->nullable()->after('scan_accuracy');
            }
        });
    }

    public function down(): void
    {
        Schema::table('visit_logs', function (Blueprint $table) {
            $table->dropColumn([
                'scan_latitude',
                'scan_longitude',
                'scan_accuracy',
                'scan_location_status',
            ]);
        });
    }
};
