<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class UpdateAccountsAddPhoneFields extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
	    Schema::table('accounts', function (Blueprint $table){
		    $table->string('work_fax');
		    $table->string('work_mobile');
	    });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
	    Schema::table('accounts', function (Blueprint $table){
		    $table->dropColumn('work_fax');
		    $table->dropColumn('work_mobile');
	    });
    }
}
