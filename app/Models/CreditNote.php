<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CreditNote extends Model
{
	use SoftDeletes {
		SoftDeletes::trashed as parentTrashed;
	}

	protected $table = 'credit_notes';

	protected $fillable = ['invoice_id'];
	protected $protected = ['created_at', 'updated_at'];
	protected $dates = ['deleted_at'];

    public function invoice()
    {
	    return $this->hasOne('App\Models\Invoice', 'invoice_id');
    }
}
