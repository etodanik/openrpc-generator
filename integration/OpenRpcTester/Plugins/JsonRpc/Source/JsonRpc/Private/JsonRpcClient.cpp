#include "JsonRpcClient.h"

#include "JsonObjectConverter.h"


UJsonRpcClient::UJsonRpcClient()
{
}

void UJsonRpcClient::Initialize(TScriptInterface<ITransportInterface> InTransport)
{
	Transport = InTransport;
}

void UJsonRpcClient::SendRequest(const FString& MethodName, const TSharedPtr<FJsonObject>& ParamsObj,
                                 const TFunction<void(const TSharedPtr<FJsonValue>&)>& OnResponse)
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
		UE_LOG(LogTemp, Verbose, TEXT("Response: %s"), *Response);

		if (FJsonSerializer::Deserialize(Reader, ResponseObj) && ResponseObj.IsValid())
		{
			if (ResponseObj->HasField(TEXT("result")))
			{
				if (TSharedPtr<FJsonValue> ResultValue = ResponseObj->Values["result"])
				{
					OnResponse(ResultValue);
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
