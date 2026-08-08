<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasColumn('medicines', 'quantity')) {
            return;
        }

        Schema::table('medicines', function (Blueprint $table) {
            $table->unsignedInteger('quantity')->default(0)->after('usage');
        });
    }

    public function down(): void
    {
        //
    }
};
