#include "JsonRpcClient.h"


UJsonRpcClient::UJsonRpcClient()
{
}

void UJsonRpcClient::Initialize(TScriptInterface<ITransportInterface> InTransport)
{
	Transport = InTransport;
}

void UJsonRpcClient::SendRequest(FString& MethodName, const TSharedPtr<FJsonObject>& ParamsObj,
                                 const TFunction<void(const TSharedPtr<FJsonObject>&)>& OnResponse)
{
	FString RequestBody;
	TSharedPtr<FJsonObject> RequestObj = MakeShareable(new FJsonObject);

	RequestObj->SetStringField(TEXT("jsonrpc"), TEXT("2.0"));
	RequestObj->SetStringField(TEXT("method"), MethodName);
	RequestObj->SetArrayField(TEXT("params"), JsonObjectToPositionalArray(ParamsObj));
	RequestObj->SetNumberField(TEXT("id"), 1);

	TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&RequestBody);
	FJsonSerializer::Serialize(RequestObj.ToSharedRef(), Writer);

	Transport->SendMessage(RequestBody, [OnResponse](const FString& Response)
	{
		TSharedPtr<FJsonObject> ResponseObj;
		TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Response);
		UE_LOG(LogTemp, Warning, TEXT("Response: %s"), *Response);

		if (FJsonSerializer::Deserialize(Reader, ResponseObj) && ResponseObj.IsValid())
		{
			if (ResponseObj->HasField(TEXT("result")))
			{
				TSharedPtr<FJsonObject> ResultObj = ResponseObj->GetObjectField(TEXT("result"));
				if (ResultObj.IsValid())
				{
					OnResponse(ResultObj);
				}
			}
		}
	});
}

TArray<TSharedPtr<FJsonValue>> UJsonRpcClient::JsonObjectToPositionalArray(const TSharedPtr<FJsonObject>& ParamsObj)
{
	TArray<TSharedPtr<FJsonValue>> JsonArray;

	if (!ParamsObj.IsValid())
	{
		return JsonArray;
	}

	for (const auto& Elem : ParamsObj->Values)
	{
		JsonArray.Add(Elem.Value);
	}

	return JsonArray;
}
