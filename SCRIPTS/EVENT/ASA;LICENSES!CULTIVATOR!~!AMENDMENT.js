//lwacht
//update AltId
//commenting out for now as amendments should only be completed in ACA
/*
try{
	newAltId = AInfo["AltId"];
	var updAltId = aa.cap.updateCapAltID(capId,newAltId);
	if(!updAltId.getSuccess()){
		logDebug("Error updating Alt Id: " + newAltId + ":: " +updAltId.getErrorMessage());
	}else{
		logDebug("Deficiency record ID updated to : " + newAltId);
	}
} catch(err){
	logDebug("An error has occurred in ASA:LICENSES/CULTIVATOR/*/AMENDMENT: Update AltId: " + err.message);
	logDebug(err.stack);
	aa.sendMail(sysFromEmail, debugEmail, "", "An error has occurred in ASA:LICENSES/CULTIVATOR/*/AMENDMENT: Update AltId: "+ startDate, capId + br + err.message+ br+ err.stack);
}
*/