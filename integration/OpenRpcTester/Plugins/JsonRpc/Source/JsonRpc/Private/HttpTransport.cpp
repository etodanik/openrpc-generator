#include "HttpTransport.h" 
#include "HttpModule.h"  
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"

UHttpTransport::UHttpTransport() {} 

void UHttpTransport::SendMessage(const FString& Message, const TFunction<void(const FString&)>& OnResponseReceived)
{
	const TSharedRef<IHttpRequest> Request = FHttpModule::Get().CreateRequest();
	Request->OnProcessRequestComplete().BindLambda(
		[OnResponseReceived](FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful)
		{
			if (bWasSuccessful && Response.IsValid())
			{
				OnResponseReceived(Response->GetContentAsString());
			}
			else
			{
				OnResponseReceived(TEXT("Request failed"));
			}
		});

	Request->SetURL(TEXT("https://nettie-ovrrzw-fast-mainnet.helius-rpc.com"));
	Request->SetVerb(TEXT("POST"));
	Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
	Request->SetContentAsString(Message);
	Request->ProcessRequest();
}
