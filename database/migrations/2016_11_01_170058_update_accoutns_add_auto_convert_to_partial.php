<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class UpdateAccoutnsAddAutoConvertToPartial extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
	    Schema::table('accounts', function(Blueprint $table){
		    $table->boolean('auto_convert_quote_to_partial')->default(0);
	    });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
	    Schema::table('accounts', function(Blueprint $table){
		    $table->dropColumn('auto_convert_quote_to_partial');
	    });
    }
}
