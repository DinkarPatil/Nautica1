from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


DocStatus = Literal["Processed", "Pending", "Flagged", "Verified"]
DocType = Literal[
    "Bill of Lading",
    "Letter of Credit",
    "Certificate of Origin",
    "Packing List",
    "Insurance Certificate",
    "Phytosanitary Certificate",
    "Commercial Invoice",
]


class TradeDocumentOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    type: DocType
    title: str
    vesselName: str = Field(validation_alias="vessel_name", serialization_alias="vesselName")
    shipper: str
    consignee: str
    portOfLoading: str = Field(validation_alias="port_of_loading", serialization_alias="portOfLoading")
    portOfDischarge: str = Field(validation_alias="port_of_discharge", serialization_alias="portOfDischarge")
    commodity: str
    value: float
    currency: str
    status: DocStatus
    issuedDate: str = Field(validation_alias="issued_date", serialization_alias="issuedDate")
    expiryDate: Optional[str] = Field(default=None, validation_alias="expiry_date", serialization_alias="expiryDate")
    smartContractHash: Optional[str] = Field(
        default=None, validation_alias="smart_contract_hash", serialization_alias="smartContractHash"
    )
    blockchainNetwork: Optional[str] = Field(
        default=None, validation_alias="blockchain_network", serialization_alias="blockchainNetwork"
    )


class TradeDocumentCreate(BaseModel):
    type: DocType
    title: str
    vesselName: str
    shipper: str
    consignee: str
    portOfLoading: str
    portOfDischarge: str
    commodity: str
    value: float
    currency: str = "USD"
    status: DocStatus = "Pending"
    issuedDate: str
    expiryDate: Optional[str] = None


class TradeApprovalOut(BaseModel):
    id: str
    status: DocStatus
    approvedBy: str
    approvedAt: datetime


class TradeContractOut(BaseModel):
    id: str
    network: Optional[str]
    txHash: Optional[str]
    parties: dict
    note: str = "Read-only blockchain reference; no on-chain action available in MVP."
