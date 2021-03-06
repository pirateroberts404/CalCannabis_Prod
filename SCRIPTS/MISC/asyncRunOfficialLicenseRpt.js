/*-----------------------------------------------------------------
	Generate the License Certificate and email to the DRP
------------------------------------------------------------------*/
var maxSeconds = 4 * 60;				// number of seconds allowed for batch processing, usually < 5*60
var useAppSpecificGroupName = false;	// Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = true;	// Use Group name when populating Task Specific Info Values
var currentUserID = "ADMIN";
var publicUser = null;
var systemUserObj = aa.person.getUser("ADMIN").getOutput();
var showDebug = true;	

var vScriptName = aa.env.getValue("ScriptCode");
var vEventName = aa.env.getValue("EventName");

var startDate = new Date();
var startTime = startDate.getTime();
var timeExpired = false;
var message = "";						// Message String
var debug = "";							// Debug String
var br = "<BR>";						// Break Tag
var emailText = "";
var catAPIChunkSize = 10;

eval(getMasterScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_BATCH"));
eval(getMasterScriptText("INCLUDES_CUSTOM"));

override = "function logDebug(dstr){ if(showDebug) { aa.print(dstr); emailText+= dstr + \"<br>\"; } }";
eval(override);

function getScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),vScriptName,"ADMIN");
	return emseScript.getScriptText() + "";
}

function getMasterScriptText(vScriptName) {
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
	return emseScript.getScriptText() + "";
}
try{
//---------------------------------------
	//aa.env.setValue("licCap", "LCA18-0000664");
	//aa.env.setValue("currentUserID", "MHART");
	//aa.env.setValue("reportName", "Official License Certificate");
	//aa.env.setValue("contType", "Designated Responsible Party");
	//aa.env.setValue("addressType", "Mailing");
	//aa.env.setValue("fromEmail","calcannabislicensing@cdfa.ca.gov")
	var reportName = "" + aa.env.getValue("reportName");
	var appCap = "" + aa.env.getValue("appCap");
	var licCap = "" + aa.env.getValue("licCap");
	var licType = "" + aa.env.getValue("licType");	
	var currentUserID = "" + aa.env.getValue("currentUserID");
	var contType = "" + aa.env.getValue("contType");
	var fromEmail = "" + aa.env.getValue("fromEmail");
	var br = "<BR>";
	var eTxt = "";
	var sDate = new Date();
	var sTime = sDate.getTime();
//-----------------------
	reportResult = aa.reportManager.getReportInfoModelByName(reportName);
	if (!reportResult.getSuccess()){
		logDebug("**WARNING** couldn't load report " + reportName + " " + reportResult.getErrorMessage()); 
		eTxt+="**WARNING** couldn't load report " + reportName + " " + reportResult.getErrorMessage() +br; 
	}
	var rFiles = [];
	var report = reportResult.getOutput(); 
	var tmpID = aa.cap.getCapID(licCap).getOutput(); 
	cap = aa.cap.getCap(tmpID).getOutput();
	appTypeResult = cap.getCapType();
	appTypeString = appTypeResult.toString(); 
	appTypeArray = appTypeString.split("/");
	report.setModule(appTypeArray[0]); 
	//report.setCapId(itemCap.getID1() + "-" + itemCap.getID2() + "-" + itemCap.getID3()); 
	report.setCapId(tmpID.getID1() + "-" + tmpID.getID2() + "-" + tmpID.getID3()); 
	report.getEDMSEntityIdModel().setAltId(licCap);
	eTxt+="reportName: " + reportName + br;
	eTxt+="reportName: " + typeof(reportName) + br;
	var parameters = aa.util.newHashMap(); 
	parameters.put("altId",licCap);
	report.setReportParameters(parameters);
	var permit = aa.reportManager.hasPermission(reportName,currentUserID); 
	if(permit.getOutput().booleanValue()) { 
		var reportResult = aa.reportManager.getReportResult(report); 
		if(reportResult) {
			reportOutput = reportResult.getOutput();
			var reportFile=aa.reportManager.storeReportToDisk(reportOutput);
			rFile=reportFile.getOutput();
			rFiles.push(rFile);
			logDebug("Report '" + reportName + "' has been run for " + licCap);
			eTxt+=("Report '" + reportName + "' has been run for " + licCap) +br;
		}else {
			logDebug("System failed get report: " + reportResult.getErrorType() + ":" +reportResult.getErrorMessage());
		}
	}else{
		logDebug("No permission to report: "+ reportName + " for user: " + currentUserID);
		eTxt+="No permission to report: "+ reportName + " for user: " + currentUserID;
	}
	var tmpID = aa.cap.getCapID(appCap).getOutput();
	var priContact = getContactObj(tmpID,contType);
	if(priContact){
		var eParams = aa.util.newHashtable(); 
		addParameter(eParams, "$$altID$$", tmpID.getCustomID());
		addParameter(eParams, "$$contactFirstName$$", priContact.capContact.firstName);
		addParameter(eParams, "$$contactLastName$$", priContact.capContact.lastName);
		addParameter(eParams, "$$parentId$$", licCap);
		addParameter(eParams, "$$licType$$", licType);
		var priEmail = ""+priContact.capContact.getEmail();
		sendApprovalNotification(fromEmail,priEmail,"","LCA_APP_APPROVAL_PAID",eParams, rFiles,tmpID);
	}else{
		logDebug("An error occurred retrieving the contactObj for " + contactType + ": " + priContact);
	}
	
//----------------------- 
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	var eTime = (thisTime - sTime) / 1000
} catch(err){
	logDebug("An error has occurred in asyncRunSubmittedApplicRpt: " + err.message);
	logDebug(err.stack);
	aa.sendMail("calcannabislicensing@cdfa.ca.gov", "mhart@trustvip.com", "", "AN ERROR HAS OCCURRED IN asyncRunSubmittedApplicRpt: ",  tmpID + br +"elapsed time: " + eTime + " seconds. " + br + "altId: " + licCap + br + "avpre6" + br + eTxt);
}
 function sendApprovalNotification(emailFrom,emailTo,emailCC,templateName,params,reportFile)
{
	itemCap = arguments[6]; 
	var id1 = itemCap.ID1;
	var id2 = itemCap.ID2;
	var id3 = itemCap.ID3;
	var capIDScriptModel = aa.cap.createCapIDScriptModel(id1, id2, id3);
	var result = null;
	result = aa.document.sendEmailAndSaveAsDocument(emailFrom, emailTo, emailCC, templateName, params, capIDScriptModel, reportFile);
	if(result.getSuccess())
	{
		logDebug("Sent email successfully!");
		return true;
	}
	else
	{
		logDebug("Failed to send mail. - " + result.getErrorType());
		return false;
	}
}
