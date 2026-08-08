<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasColumn('medicines', 'usage')) {
            return;
        }

        Schema::table('medicines', function (Blueprint $table) {
            $table->text('usage')->nullable()->after('description');
            // or string if short lang: $table->string('usage')->nullable()
        });
    }

    public function down(): void
    {
        //
    }
};
