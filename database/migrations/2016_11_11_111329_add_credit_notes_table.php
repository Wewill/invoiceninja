<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

class AddCreditNotesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('credit_notes', function(Blueprint $table){
            $table->increments('id');
            $table->integer('invoice_id')->unsigned();
	        $table->foreign('invoice_id')->references('id')->on('invoices');
	        $table->string('credit_note_number');
	        $table->timestamps();
	        $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
	    Schema::drop('credit_notes');
    }
}
