<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasColumn('events', 'category')) {
            return;
        }

        Schema::table('events', function (Blueprint $table) {
            $table->string('category')->default('General')->after('location');
        });
    }

    public function down(): void
    {
        //
    }
};
