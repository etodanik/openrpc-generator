#pragma once

#include "CoreMinimal.h"
#include "TransportInterface.h"
#include "HttpTransport.generated.h"

UCLASS()
class JSONRPC_API UHttpTransport : public UObject, public ITransportInterface
{
	GENERATED_BODY()
	UHttpTransport();

public:
	virtual void
	SendMessage(const FString& Message, const TFunction<void(const FString&)>& OnResponseReceived) override;
};
