<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'program')) {
                $table->string('program', 255)->nullable()->after('department');
            }
            if (!Schema::hasColumn('users', 'department_code')) {
                $table->string('department_code', 50)->nullable()->after('program');
            }
            if (!Schema::hasColumn('users', 'year_level')) {
                $table->string('year_level', 20)->nullable()->after('department_code');
            }
            if (!Schema::hasColumn('users', 'college')) {
                $table->string('college', 255)->nullable()->after('year_level');
            }
            if (!Schema::hasColumn('users', 'college_code')) {
                $table->string('college_code', 50)->nullable()->after('college');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = [];
            foreach (['college_code', 'college', 'year_level', 'department_code', 'program'] as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $columns[] = $col;
                }
            }
            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
