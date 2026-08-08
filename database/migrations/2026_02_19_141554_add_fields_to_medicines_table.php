<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('medicines', function (Blueprint $table) {
            if (!Schema::hasColumn('medicines', 'stock')) {
                $table->integer('stock')->default(0)->after('category');
            }
            if (!Schema::hasColumn('medicines', 'dosage')) {
                $table->string('dosage')->nullable()->after('stock');
            }
            if (!Schema::hasColumn('medicines', 'unit')) {
                $table->string('unit')->nullable()->after('dosage');
            }
            if (!Schema::hasColumn('medicines', 'expiry_date')) {
                $table->date('expiry_date')->nullable()->after('unit');
            }
        });
    }

    public function down(): void
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->dropColumn([
                'stock',
                'dosage',
                'unit',
                'expiry_date',
            ]);
        });
    }
};
