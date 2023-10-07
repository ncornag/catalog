const errorCaategories: string[] = [
  'NetworkError',
  'NetworkTimeoutError',
  'Interruption',
  'NotPrimaryError',
  'StaleShardVersionError',
  'NeedRetargettingError',
  'WriteConcernError',
  'ShutdownError',
  'CancellationError',
  'ConnectionFatalMessageParseError',
  'ExceededTimeLimitError',
  'SnapshotError',
  'VoteAbortError',
  'NonResumableChangeStreamError',
  'RetriableError',
  'CloseConnectionError',
  'VersionedAPIError',
  'ValidationError',
  'InternalOnly',
  'TenantMigrationError',
  'TenantMigrationConflictError',
  'CursorInvalidatedError'
];

type ErrorCode = {
  code: number;
  name: string;
  categories?: string[];
  extra?: string;
  extraIsOptional?: boolean;
};

const errorCodes: ErrorCode[] = [
  {
    code: 0,
    name: 'OK'
  },
  {
    code: 1,
    name: 'InternalError'
  },
  {
    code: 2,
    name: 'BadValue'
  },
  {
    code: 3,
    name: 'OBSOLETE_DuplicateKey'
  },
  {
    code: 4,
    name: 'NoSuchKey'
  },
  {
    code: 5,
    name: 'GraphContainsCycle'
  },
  {
    code: 6,
    name: 'HostUnreachable',
    categories: ['NetworkError', 'RetriableError']
  },
  {
    code: 7,
    name: 'HostNotFound',
    categories: ['NetworkError', 'RetriableError']
  },
  {
    code: 8,
    name: 'UnknownError'
  },
  {
    code: 9,
    name: 'FailedToParse'
  },
  {
    code: 10,
    name: 'CannotMutateObject'
  },
  {
    code: 11,
    name: 'UserNotFound'
  },
  {
    code: 12,
    name: 'UnsupportedFormat'
  },
  {
    code: 13,
    name: 'Unauthorized'
  },
  {
    code: 14,
    name: 'TypeMismatch'
  },
  {
    code: 15,
    name: 'Overflow',
    categories: ['ValidationError']
  },
  {
    code: 16,
    name: 'InvalidLength'
  },
  {
    code: 17,
    name: 'ProtocolError'
  },
  {
    code: 18,
    name: 'AuthenticationFailed'
  },
  {
    code: 19,
    name: 'CannotReuseObject'
  },
  {
    code: 20,
    name: 'IllegalOperation'
  },
  {
    code: 21,
    name: 'EmptyArrayOperation'
  },
  {
    code: 22,
    name: 'InvalidBSON',
    categories: ['ValidationError']
  },
  {
    code: 23,
    name: 'AlreadyInitialized'
  },
  {
    code: 24,
    name: 'LockTimeout',
    categories: ['Interruption']
  },
  {
    code: 25,
    name: 'RemoteValidationError'
  },
  {
    code: 26,
    name: 'NamespaceNotFound'
  },
  {
    code: 27,
    name: 'IndexNotFound'
  },
  {
    code: 28,
    name: 'PathNotViable'
  },
  {
    code: 29,
    name: 'NonExistentPath'
  },
  {
    code: 30,
    name: 'InvalidPath'
  },
  {
    code: 31,
    name: 'RoleNotFound'
  },
  {
    code: 32,
    name: 'RolesNotRelated'
  },
  {
    code: 33,
    name: 'PrivilegeNotFound'
  },
  {
    code: 34,
    name: 'CannotBackfillArray'
  },
  {
    code: 35,
    name: 'UserModificationFailed'
  },
  {
    code: 36,
    name: 'RemoteChangeDetected'
  },
  {
    code: 37,
    name: 'FileRenameFailed'
  },
  {
    code: 38,
    name: 'FileNotOpen'
  },
  {
    code: 39,
    name: 'FileStreamFailed'
  },
  {
    code: 40,
    name: 'ConflictingUpdateOperators'
  },
  {
    code: 41,
    name: 'FileAlreadyOpen'
  },
  {
    code: 42,
    name: 'LogWriteFailed'
  },
  {
    code: 43,
    name: 'CursorNotFound',
    categories: ['CursorInvalidatedError']
  },
  {
    code: 45,
    name: 'UserDataInconsistent'
  },
  {
    code: 46,
    name: 'LockBusy'
  },
  {
    code: 47,
    name: 'NoMatchingDocument'
  },
  {
    code: 48,
    name: 'NamespaceExists'
  },
  {
    code: 49,
    name: 'InvalidRoleModification'
  },
  {
    code: 50,
    name: 'MaxTimeMSExpired',
    categories: ['Interruption', 'ExceededTimeLimitError']
  },
  {
    code: 51,
    name: 'ManualInterventionRequired'
  },
  {
    code: 52,
    name: 'DollarPrefixedFieldName'
  },
  {
    code: 53,
    name: 'InvalidIdField'
  },
  {
    code: 54,
    name: 'NotSingleValueField'
  },
  {
    code: 55,
    name: 'InvalidDBRef'
  },
  {
    code: 56,
    name: 'EmptyFieldName'
  },
  {
    code: 57,
    name: 'DottedFieldName'
  },
  {
    code: 58,
    name: 'RoleModificationFailed'
  },
  {
    code: 59,
    name: 'CommandNotFound'
  },
  {
    code: 60,
    name: 'OBSOLETE_DatabaseNotFound'
  },
  {
    code: 61,
    name: 'ShardKeyNotFound'
  },
  {
    code: 62,
    name: 'OplogOperationUnsupported'
  },
  {
    code: 63,
    name: 'OBSOLETE_StaleShardVersion'
  },
  {
    code: 64,
    name: 'WriteConcernFailed',
    categories: ['WriteConcernError']
  },
  {
    code: 65,
    name: 'MultipleErrorsOccurred',
    extra: 'MultipleErrorsOccurredInfo'
  },
  {
    code: 66,
    name: 'ImmutableField'
  },
  {
    code: 67,
    name: 'CannotCreateIndex'
  },
  {
    code: 68,
    name: 'IndexAlreadyExists'
  },
  {
    code: 69,
    name: 'AuthSchemaIncompatible'
  },
  {
    code: 70,
    name: 'ShardNotFound'
  },
  {
    code: 71,
    name: 'ReplicaSetNotFound'
  },
  {
    code: 72,
    name: 'InvalidOptions'
  },
  {
    code: 73,
    name: 'InvalidNamespace'
  },
  {
    code: 74,
    name: 'NodeNotFound'
  },
  {
    code: 75,
    name: 'WriteConcernLegacyOK',
    categories: ['WriteConcernError']
  },
  {
    code: 76,
    name: 'NoReplicationEnabled'
  },
  {
    code: 77,
    name: 'OperationIncomplete'
  },
  {
    code: 78,
    name: 'CommandResultSchemaViolation'
  },
  {
    code: 79,
    name: 'UnknownReplWriteConcern',
    categories: ['WriteConcernError']
  },
  {
    code: 80,
    name: 'RoleDataInconsistent'
  },
  {
    code: 81,
    name: 'NoMatchParseContext'
  },
  {
    code: 82,
    name: 'NoProgressMade'
  },
  {
    code: 83,
    name: 'RemoteResultsUnavailable'
  },
  {
    code: 84,
    name: 'OBSOLETE_DuplicateKeyValue'
  },
  {
    code: 85,
    name: 'IndexOptionsConflict'
  },
  {
    code: 86,
    name: 'IndexKeySpecsConflict'
  },
  {
    code: 87,
    name: 'CannotSplit'
  },
  {
    code: 88,
    name: 'OBSOLETE_SplitFailed'
  },
  {
    code: 89,
    name: 'NetworkTimeout',
    categories: ['NetworkError', 'RetriableError', 'NetworkTimeoutError']
  },
  {
    code: 90,
    name: 'CallbackCanceled',
    categories: ['CancellationError']
  },
  {
    code: 91,
    name: 'ShutdownInProgress',
    extra: 'ShutdownInProgressQuiesceInfo',
    categories: ['ShutdownError', 'CancellationError', 'RetriableError'],
    extraIsOptional: true
  },
  {
    code: 92,
    name: 'SecondaryAheadOfPrimary'
  },
  {
    code: 93,
    name: 'InvalidReplicaSetConfig'
  },
  {
    code: 94,
    name: 'NotYetInitialized'
  },
  {
    code: 95,
    name: 'NotSecondary'
  },
  {
    code: 96,
    name: 'OperationFailed',
    categories: ['CursorInvalidatedError']
  },
  {
    code: 97,
    name: 'NoProjectionFound'
  },
  {
    code: 98,
    name: 'DBPathInUse'
  },
  {
    code: 100,
    name: 'UnsatisfiableWriteConcern',
    categories: ['WriteConcernError']
  },
  {
    code: 101,
    name: 'OutdatedClient'
  },
  {
    code: 102,
    name: 'IncompatibleAuditMetadata'
  },
  {
    code: 103,
    name: 'NewReplicaSetConfigurationIncompatible'
  },
  {
    code: 104,
    name: 'NodeNotElectable'
  },
  {
    code: 105,
    name: 'IncompatibleShardingMetadata'
  },
  {
    code: 106,
    name: 'DistributedClockSkewed'
  },
  {
    code: 107,
    name: 'LockFailed'
  },
  {
    code: 108,
    name: 'InconsistentReplicaSetNames'
  },
  {
    code: 109,
    name: 'ConfigurationInProgress'
  },
  {
    code: 110,
    name: 'CannotInitializeNodeWithData'
  },
  {
    code: 111,
    name: 'NotExactValueField'
  },
  {
    code: 112,
    name: 'WriteConflict'
  },
  {
    code: 113,
    name: 'InitialSyncFailure'
  },
  {
    code: 114,
    name: 'InitialSyncOplogSourceMissing'
  },
  {
    code: 115,
    name: 'CommandNotSupported'
  },
  {
    code: 116,
    name: 'DocTooLargeForCapped'
  },
  {
    code: 117,
    name: 'ConflictingOperationInProgress'
  },
  {
    code: 118,
    name: 'NamespaceNotSharded'
  },
  {
    code: 119,
    name: 'InvalidSyncSource'
  },
  {
    code: 120,
    name: 'OplogStartMissing'
  },
  {
    code: 121,
    name: 'DocumentValidationFailure',
    extra: 'doc_validation_error::DocumentValidationFailureInfo'
  },
  {
    code: 122,
    name: 'OBSOLETE_ReadAfterOptimeTimeout'
  },
  {
    code: 123,
    name: 'NotAReplicaSet'
  },
  {
    code: 124,
    name: 'IncompatibleElectionProtocol'
  },
  {
    code: 125,
    name: 'CommandFailed'
  },
  {
    code: 126,
    name: 'RPCProtocolNegotiationFailed'
  },
  {
    code: 127,
    name: 'UnrecoverableRollbackError'
  },
  {
    code: 128,
    name: 'LockNotFound'
  },
  {
    code: 129,
    name: 'LockStateChangeFailed'
  },
  {
    code: 130,
    name: 'SymbolNotFound'
  },
  {
    code: 132,
    name: 'OBSOLETE_ConfigServersInconsistent'
  },
  {
    code: 133,
    name: 'FailedToSatisfyReadPreference'
  },
  {
    code: 134,
    name: 'ReadConcernMajorityNotAvailableYet',
    categories: ['RetriableError']
  },
  {
    code: 135,
    name: 'StaleTerm'
  },
  {
    code: 136,
    name: 'CappedPositionLost'
  },
  {
    code: 137,
    name: 'IncompatibleShardingConfigVersion'
  },
  {
    code: 138,
    name: 'RemoteOplogStale'
  },
  {
    code: 139,
    name: 'JSInterpreterFailure'
  },
  {
    code: 140,
    name: 'InvalidSSLConfiguration'
  },
  {
    code: 141,
    name: 'SSLHandshakeFailed'
  },
  {
    code: 142,
    name: 'JSUncatchableError'
  },
  {
    code: 143,
    name: 'CursorInUse'
  },
  {
    code: 144,
    name: 'IncompatibleCatalogManager'
  },
  {
    code: 145,
    name: 'PooledConnectionsDropped'
  },
  {
    code: 146,
    name: 'ExceededMemoryLimit'
  },
  {
    code: 147,
    name: 'ZLibError'
  },
  {
    code: 148,
    name: 'ReadConcernMajorityNotEnabled',
    categories: ['VoteAbortError']
  },
  {
    code: 149,
    name: 'NoConfigPrimary'
  },
  {
    code: 150,
    name: 'StaleEpoch',
    categories: ['StaleShardVersionError', 'NeedRetargettingError'],
    extra: 'StaleEpochInfo',
    extraIsOptional: true
  },
  {
    code: 151,
    name: 'OperationCannotBeBatched'
  },
  {
    code: 152,
    name: 'OplogOutOfOrder'
  },
  {
    code: 153,
    name: 'ChunkTooBig'
  },
  {
    code: 154,
    name: 'InconsistentShardIdentity'
  },
  {
    code: 155,
    name: 'CannotApplyOplogWhilePrimary'
  },
  {
    code: 156,
    name: 'OBSOLETE_NeedsDocumentMove'
  },
  {
    code: 157,
    name: 'CanRepairToDowngrade'
  },
  {
    code: 158,
    name: 'MustUpgrade'
  },
  {
    code: 159,
    name: 'DurationOverflow'
  },
  {
    code: 160,
    name: 'MaxStalenessOutOfRange'
  },
  {
    code: 161,
    name: 'IncompatibleCollationVersion'
  },
  {
    code: 162,
    name: 'CollectionIsEmpty'
  },
  {
    code: 163,
    name: 'ZoneStillInUse'
  },
  {
    code: 164,
    name: 'InitialSyncActive'
  },
  {
    code: 165,
    name: 'ViewDepthLimitExceeded'
  },
  {
    code: 166,
    name: 'CommandNotSupportedOnView'
  },
  {
    code: 167,
    name: 'OptionNotSupportedOnView'
  },
  {
    code: 168,
    name: 'InvalidPipelineOperator'
  },
  {
    code: 169,
    name: 'CommandOnShardedViewNotSupportedOnMongod',
    extra: 'ResolvedView'
  },
  {
    code: 170,
    name: 'TooManyMatchingDocuments'
  },
  {
    code: 171,
    name: 'CannotIndexParallelArrays'
  },
  {
    code: 172,
    name: 'TransportSessionClosed'
  },
  {
    code: 173,
    name: 'TransportSessionNotFound'
  },
  {
    code: 174,
    name: 'TransportSessionUnknown'
  },
  {
    code: 175,
    name: 'QueryPlanKilled',
    categories: ['CursorInvalidatedError']
  },
  {
    code: 176,
    name: 'FileOpenFailed'
  },
  {
    code: 177,
    name: 'ZoneNotFound'
  },
  {
    code: 178,
    name: 'RangeOverlapConflict'
  },
  {
    code: 179,
    name: 'WindowsPdhError'
  },
  {
    code: 180,
    name: 'BadPerfCounterPath'
  },
  {
    code: 181,
    name: 'AmbiguousIndexKeyPattern'
  },
  {
    code: 182,
    name: 'InvalidViewDefinition'
  },
  {
    code: 183,
    name: 'ClientMetadataMissingField'
  },
  {
    code: 184,
    name: 'ClientMetadataAppNameTooLarge'
  },
  {
    code: 185,
    name: 'ClientMetadataDocumentTooLarge'
  },
  {
    code: 186,
    name: 'ClientMetadataCannotBeMutated'
  },
  {
    code: 187,
    name: 'LinearizableReadConcernError'
  },
  {
    code: 188,
    name: 'IncompatibleServerVersion'
  },
  {
    code: 189,
    name: 'PrimarySteppedDown',
    categories: ['NotPrimaryError', 'RetriableError']
  },
  {
    code: 190,
    name: 'MasterSlaveConnectionFailure'
  },
  {
    code: 191,
    name: 'OBSOLETE_BalancerLostDistributedLock'
  },
  {
    code: 192,
    name: 'FailPointEnabled'
  },
  {
    code: 193,
    name: 'NoShardingEnabled'
  },
  {
    code: 194,
    name: 'BalancerInterrupted'
  },
  {
    code: 195,
    name: 'ViewPipelineMaxSizeExceeded'
  },
  {
    code: 197,
    name: 'InvalidIndexSpecificationOption'
  },
  {
    code: 198,
    name: 'OBSOLETE_ReceivedOpReplyMessage'
  },
  {
    code: 199,
    name: 'ReplicaSetMonitorRemoved'
  },
  {
    code: 200,
    name: 'ChunkRangeCleanupPending'
  },
  {
    code: 201,
    name: 'CannotBuildIndexKeys'
  },
  {
    code: 202,
    name: 'NetworkInterfaceExceededTimeLimit',
    categories: ['ExceededTimeLimitError', 'NetworkTimeoutError']
  },
  {
    code: 203,
    name: 'ShardingStateNotInitialized'
  },
  {
    code: 204,
    name: 'TimeProofMismatch'
  },
  {
    code: 205,
    name: 'ClusterTimeFailsRateLimiter'
  },
  {
    code: 206,
    name: 'NoSuchSession'
  },
  {
    code: 207,
    name: 'InvalidUUID'
  },
  {
    code: 208,
    name: 'TooManyLocks'
  },
  {
    code: 209,
    name: 'StaleClusterTime'
  },
  {
    code: 210,
    name: 'CannotVerifyAndSignLogicalTime'
  },
  {
    code: 211,
    name: 'KeyNotFound'
  },
  {
    code: 212,
    name: 'IncompatibleRollbackAlgorithm'
  },
  {
    code: 213,
    name: 'DuplicateSession'
  },
  {
    code: 214,
    name: 'AuthenticationRestrictionUnmet'
  },
  {
    code: 215,
    name: 'DatabaseDropPending'
  },
  {
    code: 216,
    name: 'ElectionInProgress'
  },
  {
    code: 217,
    name: 'IncompleteTransactionHistory'
  },
  {
    code: 218,
    name: 'UpdateOperationFailed'
  },
  {
    code: 219,
    name: 'FTDCPathNotSet'
  },
  {
    code: 220,
    name: 'FTDCPathAlreadySet'
  },
  {
    code: 221,
    name: 'IndexModified'
  },
  {
    code: 222,
    name: 'CloseChangeStream'
  },
  {
    code: 223,
    name: 'IllegalOpMsgFlag',
    categories: ['ConnectionFatalMessageParseError']
  },
  {
    code: 224,
    name: 'QueryFeatureNotAllowed'
  },
  {
    code: 225,
    name: 'TransactionTooOld',
    categories: ['VoteAbortError']
  },
  {
    code: 226,
    name: 'AtomicityFailure'
  },
  {
    code: 227,
    name: 'CannotImplicitlyCreateCollection',
    extra: 'CannotImplicitlyCreateCollectionInfo'
  },
  {
    code: 228,
    name: 'SessionTransferIncomplete'
  },
  {
    code: 229,
    name: 'MustDowngrade'
  },
  {
    code: 230,
    name: 'DNSHostNotFound'
  },
  {
    code: 231,
    name: 'DNSProtocolError'
  },
  {
    code: 232,
    name: 'MaxSubPipelineDepthExceeded'
  },
  {
    code: 233,
    name: 'TooManyDocumentSequences',
    categories: ['ConnectionFatalMessageParseError']
  },
  {
    code: 234,
    name: 'RetryChangeStream'
  },
  {
    code: 235,
    name: 'InternalErrorNotSupported'
  },
  {
    code: 236,
    name: 'ForTestingErrorExtraInfo',
    extra: 'ErrorExtraInfoExample'
  },
  {
    code: 237,
    name: 'CursorKilled',
    categories: ['Interruption', 'CursorInvalidatedError']
  },
  {
    code: 238,
    name: 'NotImplemented'
  },
  {
    code: 239,
    name: 'SnapshotTooOld',
    categories: ['SnapshotError']
  },
  {
    code: 240,
    name: 'DNSRecordTypeMismatch'
  },
  {
    code: 241,
    name: 'ConversionFailure'
  },
  {
    code: 242,
    name: 'CannotCreateCollection'
  },
  {
    code: 243,
    name: 'IncompatibleWithUpgradedServer'
  },
  {
    code: 244,
    name: 'NOT_YET_AVAILABLE_TransactionAborted'
  },
  {
    code: 245,
    name: 'BrokenPromise'
  },
  {
    code: 246,
    name: 'SnapshotUnavailable',
    categories: ['SnapshotError']
  },
  {
    code: 247,
    name: 'ProducerConsumerQueueBatchTooLarge'
  },
  {
    code: 248,
    name: 'ProducerConsumerQueueEndClosed'
  },
  {
    code: 249,
    name: 'StaleDbVersion',
    extra: 'StaleDbRoutingVersion'
  },
  {
    code: 250,
    name: 'StaleChunkHistory',
    categories: ['SnapshotError']
  },
  {
    code: 251,
    name: 'NoSuchTransaction',
    categories: ['VoteAbortError']
  },
  {
    code: 252,
    name: 'ReentrancyNotAllowed'
  },
  {
    code: 256,
    name: 'TransactionCommitted'
  },
  {
    code: 257,
    name: 'TransactionTooLarge'
  },
  {
    code: 258,
    name: 'UnknownFeatureCompatibilityVersion'
  },
  {
    code: 259,
    name: 'KeyedExecutorRetry'
  },
  {
    code: 260,
    name: 'InvalidResumeToken'
  },
  {
    code: 261,
    name: 'TooManyLogicalSessions'
  },
  {
    code: 262,
    name: 'ExceededTimeLimit',
    categories: ['Interruption', 'ExceededTimeLimitError', 'RetriableError']
  },
  {
    code: 263,
    name: 'OperationNotSupportedInTransaction',
    categories: ['VoteAbortError']
  },
  {
    code: 264,
    name: 'TooManyFilesOpen'
  },
  {
    code: 265,
    name: 'OrphanedRangeCleanUpFailed'
  },
  {
    code: 266,
    name: 'FailPointSetFailed'
  },
  {
    code: 267,
    name: 'PreparedTransactionInProgress'
  },
  {
    code: 268,
    name: 'CannotBackup'
  },
  {
    code: 269,
    name: 'DataModifiedByRepair'
  },
  {
    code: 270,
    name: 'RepairedReplicaSetNode'
  },
  {
    code: 271,
    name: 'JSInterpreterFailureWithStack',
    extra: 'JSExceptionInfo'
  },
  {
    code: 272,
    name: 'MigrationConflict',
    categories: ['SnapshotError']
  },
  {
    code: 273,
    name: 'ProducerConsumerQueueProducerQueueDepthExceeded'
  },
  {
    code: 274,
    name: 'ProducerConsumerQueueConsumed'
  },
  {
    code: 275,
    name: 'ExchangePassthrough'
  },
  {
    code: 276,
    name: 'IndexBuildAborted'
  },
  {
    code: 277,
    name: 'AlarmAlreadyFulfilled'
  },
  {
    code: 278,
    name: 'UnsatisfiableCommitQuorum'
  },
  {
    code: 279,
    name: 'ClientDisconnect',
    categories: ['Interruption']
  },
  {
    code: 280,
    name: 'ChangeStreamFatalError',
    categories: ['NonResumableChangeStreamError']
  },
  {
    code: 281,
    name: 'TransactionCoordinatorSteppingDown',
    categories: ['Interruption']
  },
  {
    code: 282,
    name: 'TransactionCoordinatorReachedAbortDecision',
    categories: ['Interruption']
  },
  {
    code: 283,
    name: 'WouldChangeOwningShard',
    extra: 'WouldChangeOwningShardInfo'
  },
  {
    code: 284,
    name: 'ForTestingErrorExtraInfoWithExtraInfoInNamespace',
    extra: 'nested::twice::NestedErrorExtraInfoExample'
  },
  {
    code: 285,
    name: 'IndexBuildAlreadyInProgress'
  },
  {
    code: 286,
    name: 'ChangeStreamHistoryLost',
    categories: ['NonResumableChangeStreamError']
  },
  {
    code: 287,
    name: 'TransactionCoordinatorDeadlineTaskCanceled',
    categories: ['InternalOnly']
  },
  {
    code: 288,
    name: 'ChecksumMismatch',
    categories: ['ConnectionFatalMessageParseError']
  },
  {
    code: 289,
    name: 'WaitForMajorityServiceEarlierOpTimeAvailable',
    categories: ['InternalOnly']
  },
  {
    code: 290,
    name: 'TransactionExceededLifetimeLimitSeconds',
    categories: ['Interruption', 'ExceededTimeLimitError']
  },
  {
    code: 291,
    name: 'NoQueryExecutionPlans'
  },
  {
    code: 292,
    name: 'QueryExceededMemoryLimitNoDiskUseAllowed'
  },
  {
    code: 293,
    name: 'InvalidSeedList'
  },
  {
    code: 294,
    name: 'InvalidTopologyType'
  },
  {
    code: 295,
    name: 'InvalidHeartBeatFrequency'
  },
  {
    code: 296,
    name: 'TopologySetNameRequired'
  },
  {
    code: 297,
    name: 'HierarchicalAcquisitionLevelViolation'
  },
  {
    code: 298,
    name: 'InvalidServerType'
  },
  {
    code: 299,
    name: 'OCSPCertificateStatusRevoked'
  },
  {
    code: 300,
    name: 'RangeDeletionAbandonedBecauseCollectionWithUUIDDoesNotExist'
  },
  {
    code: 301,
    name: 'DataCorruptionDetected'
  },
  {
    code: 302,
    name: 'OCSPCertificateStatusUnknown'
  },
  {
    code: 303,
    name: 'SplitHorizonChange',
    categories: ['CloseConnectionError']
  },
  {
    code: 304,
    name: 'ShardInvalidatedForTargeting',
    extra: 'ShardInvalidatedForTargetingInfo'
  },
  {
    code: 306,
    name: 'ReadThroughCacheLookupCanceled',
    categories: ['InternalOnly']
  },
  {
    code: 307,
    name: 'RangeDeletionAbandonedBecauseTaskDocumentDoesNotExist'
  },
  {
    code: 308,
    name: 'CurrentConfigNotCommittedYet'
  },
  {
    code: 309,
    name: 'ExhaustCommandFinished'
  },
  {
    code: 310,
    name: 'PeriodicJobIsStopped',
    categories: ['CancellationError']
  },
  {
    code: 311,
    name: 'TransactionCoordinatorCanceled',
    categories: ['InternalOnly']
  },
  {
    code: 312,
    name: 'OperationIsKilledAndDelisted',
    categories: ['CancellationError', 'InternalOnly']
  },
  {
    code: 313,
    name: 'ResumableRangeDeleterDisabled'
  },
  {
    code: 314,
    name: 'ObjectIsBusy',
    categories: ['CursorInvalidatedError']
  },
  {
    code: 315,
    name: 'TooStaleToSyncFromSource',
    categories: ['InternalOnly']
  },
  {
    code: 316,
    name: 'QueryTrialRunCompleted',
    categories: ['InternalOnly']
  },
  {
    code: 317,
    name: 'ConnectionPoolExpired',
    categories: ['NetworkError', 'RetriableError', 'InternalOnly']
  },
  {
    code: 318,
    name: 'ForTestingOptionalErrorExtraInfo',
    extra: 'OptionalErrorExtraInfoExample',
    extraIsOptional: true
  },
  {
    code: 319,
    name: 'MovePrimaryInProgress'
  },
  {
    code: 320,
    name: 'TenantMigrationConflict',
    extra: 'TenantMigrationConflictInfo',
    categories: ['TenantMigrationError', 'TenantMigrationConflictError']
  },
  {
    code: 321,
    name: 'TenantMigrationCommitted',
    categories: ['TenantMigrationError']
  },
  {
    code: 322,
    name: 'APIVersionError',
    categories: ['VersionedAPIError']
  },
  {
    code: 323,
    name: 'APIStrictError',
    categories: ['VersionedAPIError']
  },
  {
    code: 324,
    name: 'APIDeprecationError',
    categories: ['VersionedAPIError']
  },
  {
    code: 325,
    name: 'TenantMigrationAborted',
    categories: ['TenantMigrationError']
  },
  {
    code: 326,
    name: 'OplogQueryMinTsMissing'
  },
  {
    code: 327,
    name: 'NoSuchTenantMigration'
  },
  {
    code: 328,
    name: 'TenantMigrationAccessBlockerShuttingDown',
    categories: ['InternalOnly']
  },
  {
    code: 329,
    name: 'TenantMigrationInProgress'
  },
  {
    code: 330,
    name: 'SkipCommandExecution'
  },
  {
    code: 331,
    name: 'FailedToRunWithReplyBuilder'
  },
  {
    code: 332,
    name: 'CannotDowngrade'
  },
  {
    code: 333,
    name: 'ServiceExecutorInShutdown',
    categories: ['ShutdownError', 'CancellationError', 'InternalOnly']
  },
  {
    code: 334,
    name: 'MechanismUnavailable'
  },
  {
    code: 335,
    name: 'TenantMigrationForgotten'
  },
  {
    code: 336,
    name: 'TimeseriesBucketCleared',
    categories: ['InternalOnly']
  },
  {
    code: 337,
    name: 'AuthenticationAbandoned',
    categories: ['InternalOnly']
  },
  {
    code: 338,
    name: 'ReshardCollectionInProgress'
  },
  {
    code: 339,
    name: 'NoSuchReshardCollection'
  },
  {
    code: 340,
    name: 'ReshardCollectionCommitted'
  },
  {
    code: 341,
    name: 'ReshardCollectionAborted'
  },
  {
    code: 342,
    name: 'ReshardingCriticalSectionTimeout'
  },
  {
    code: 343,
    name: 'ShardCannotRefreshDueToLocksHeld',
    extra: 'ShardCannotRefreshDueToLocksHeldInfo'
  },
  {
    code: 344,
    name: 'AuditingNotEnabled'
  },
  {
    code: 345,
    name: 'RuntimeAuditConfigurationNotEnabled'
  },
  {
    code: 346,
    name: 'ChangeStreamInvalidated',
    extra: 'ChangeStreamInvalidationInfo'
  },
  {
    code: 347,
    name: 'APIMismatchError',
    categories: ['VersionedAPIError', 'VoteAbortError']
  },
  {
    code: 348,
    name: 'ChangeStreamTopologyChange',
    extra: 'ChangeStreamTopologyChangeInfo'
  },
  {
    code: 349,
    name: 'KeyPatternShorterThanBound'
  },
  {
    code: 350,
    name: 'ReshardCollectionTruncatedError'
  },
  {
    code: 351,
    name: 'ChangeStreamStartAfterInvalidate',
    extra: 'ChangeStreamStartAfterInvalidateInfo'
  },
  {
    code: 352,
    name: 'UnsupportedOpQueryCommand'
  },
  {
    code: 353,
    name: 'NonRetryableTenantMigrationConflict',
    extra: 'NonRetryableTenantMigrationConflictInfo',
    categories: ['TenantMigrationError', 'TenantMigrationConflictError']
  },
  {
    code: 354,
    name: 'LoadBalancerSupportMismatch',
    categories: ['CloseConnectionError']
  },
  {
    code: 355,
    name: 'InterruptedDueToStorageChange',
    categories: ['Interruption', 'CancellationError']
  },
  {
    code: 356,
    name: 'TxnRetryCounterTooOld',
    extra: 'TxnRetryCounterTooOldInfo',
    categories: ['VoteAbortError']
  },
  {
    code: 357,
    name: 'InvalidBSONType'
  },
  {
    code: 358,
    name: 'InternalTransactionNotSupported',
    categories: ['RetriableError']
  },
  {
    code: 359,
    name: 'CannotConvertIndexToUnique',
    extra: 'CannotConvertIndexToUniqueInfo'
  },
  {
    code: 360,
    name: 'PlacementVersionRefreshCanceled',
    categories: ['InternalOnly']
  },
  {
    code: 361,
    name: 'CollectionUUIDMismatch',
    extra: 'CollectionUUIDMismatchInfo'
  },
  {
    code: 362,
    name: 'FutureAlreadyRetrieved'
  },
  {
    code: 363,
    name: 'RetryableTransactionInProgress'
  },
  {
    code: 365,
    name: 'TemporarilyUnavailable'
  },
  {
    code: 366,
    name: 'WouldChangeOwningShardDeletedNoDocument'
  },
  {
    code: 367,
    name: 'FLECompactionPlaceholder'
  },
  {
    code: 369,
    name: 'FLETransactionAbort'
  },
  {
    code: 370,
    name: 'CannotDropShardKeyIndex'
  },
  {
    code: 371,
    name: 'UserWritesBlocked'
  },
  {
    code: 372,
    name: 'CloseConnectionForShutdownCommand',
    categories: ['CloseConnectionError', 'InternalOnly']
  },
  {
    code: 373,
    name: 'InternalTransactionsExhaustiveFindHasMore'
  },
  {
    code: 374,
    name: 'TransactionAPIMustRetryTransaction',
    categories: ['InternalOnly']
  },
  {
    code: 375,
    name: 'TransactionAPIMustRetryCommit',
    categories: ['InternalOnly']
  },
  {
    code: 376,
    name: 'ChangeStreamNotEnabled'
  },
  {
    code: 377,
    name: 'FLEMaxTagLimitExceeded'
  },
  {
    code: 378,
    name: 'NonConformantBSON',
    categories: ['ValidationError']
  },
  {
    code: 379,
    name: 'DatabaseMetadataRefreshCanceled',
    categories: ['InternalOnly']
  },
  {
    code: 380,
    name: 'RequestAlreadyFulfilled'
  },
  {
    code: 381,
    name: 'ReshardingCoordinatorServiceConflictingOperationInProgress',
    extra: 'ReshardingCoordinatorServiceConflictingOperationInProgressInfo',
    categories: ['InternalOnly']
  },
  {
    code: 382,
    name: 'RemoteCommandExecutionError',
    extra: 'AsyncRPCErrorInfo',
    categories: ['InternalOnly']
  },
  {
    code: 383,
    name: 'CollectionIsEmptyLocally'
  },
  {
    code: 384,
    name: 'ConnectionError',
    categories: ['NetworkError', 'RetriableError', 'InternalOnly']
  },
  {
    code: 385,
    name: 'ConflictingServerlessOperation'
  },
  {
    code: 386,
    name: 'DuplicateKeyId'
  },
  {
    code: 387,
    name: 'EncounteredFLEPayloadWhileApplyingHmac'
  },
  {
    code: 388,
    name: 'TransactionTooLargeForCache'
  },
  {
    code: 389,
    name: 'LibmongocryptError'
  },
  {
    code: 390,
    name: 'InvalidSignature'
  },
  {
    code: 391,
    name: 'ReauthenticationRequired'
  },
  {
    code: 392,
    name: 'InvalidJWT'
  },
  {
    code: 393,
    name: 'InvalidTenantId'
  },
  {
    code: 395,
    name: 'TruncatedSerialization'
  },
  {
    code: 396,
    name: 'IndexInformationTooLarge'
  },
  {
    code: 398,
    name: 'StreamTerminated',
    categories: ['CloseConnectionError']
  },
  {
    code: 400,
    name: 'CannotUpgrade'
  },
  {
    code: 401,
    name: 'ResumeTenantChangeStream'
  },
  {
    code: 402,
    name: 'ResourceExhausted',
    categories: ['RetriableError']
  },
  {
    code: 403,
    name: 'UnsupportedShardingEventNotification'
  },
  {
    code: 404,
    name: 'LDAPRoleAcquisitionError'
  },
  {
    code: 9001,
    name: 'SocketException',
    categories: ['NetworkError', 'RetriableError']
  },
  {
    code: 9996,
    name: 'OBSOLETE_RecvStaleConfig'
  },
  {
    code: 10003,
    name: 'CannotGrowDocumentInCappedNamespace'
  },
  {
    code: 10058,
    name: 'LegacyNotPrimary'
  },
  {
    code: 10107,
    name: 'NotWritablePrimary',
    categories: ['NotPrimaryError', 'RetriableError']
  },
  {
    code: 10334,
    name: 'BSONObjectTooLarge'
  },
  {
    code: 11000,
    name: 'DuplicateKey',
    extra: 'DuplicateKeyErrorInfo'
  },
  {
    code: 11600,
    name: 'InterruptedAtShutdown',
    categories: ['Interruption', 'ShutdownError', 'CancellationError', 'RetriableError']
  },
  {
    code: 11601,
    name: 'Interrupted',
    categories: ['Interruption']
  },
  {
    code: 11602,
    name: 'InterruptedDueToReplStateChange',
    categories: ['Interruption', 'NotPrimaryError', 'RetriableError']
  },
  {
    code: 12586,
    name: 'BackgroundOperationInProgressForDatabase'
  },
  {
    code: 12587,
    name: 'BackgroundOperationInProgressForNamespace'
  },
  {
    code: 13104,
    name: 'OBSOLETE_PrepareConfigsFailed'
  },
  {
    code: 13113,
    name: 'MergeStageNoMatchingDocument'
  },
  {
    code: 13297,
    name: 'DatabaseDifferCase'
  },
  {
    code: 13388,
    name: 'StaleConfig',
    extra: 'StaleConfigInfo',
    categories: ['StaleShardVersionError', 'NeedRetargettingError']
  },
  {
    code: 13435,
    name: 'NotPrimaryNoSecondaryOk',
    categories: ['NotPrimaryError', 'RetriableError']
  },
  {
    code: 13436,
    name: 'NotPrimaryOrSecondary',
    categories: ['NotPrimaryError', 'RetriableError']
  },
  {
    code: 14031,
    name: 'OutOfDiskSpace'
  },
  {
    code: 17280,
    name: 'OBSOLETE_KeyTooLong'
  },
  {
    code: 28769,
    name: 'NamespaceCannotBeSharded'
  },
  {
    code: 31082,
    name: 'SearchNotEnabled'
  },
  {
    code: 40414,
    name: 'IDLFailedToParse'
  },
  {
    code: 46841,
    name: 'ClientMarkedKilled',
    categories: ['Interruption', 'CancellationError']
  },
  {
    code: 50768,
    name: 'NotARetryableWriteCommand'
  },
  {
    code: 50915,
    name: 'BackupCursorOpenConflictWithCheckpoint',
    categories: ['RetriableError']
  },
  {
    code: 56846,
    name: 'ConfigServerUnreachable'
  },
  {
    code: 57986,
    name: 'RetryableInternalTransactionNotSupported'
  }
];

export const errorName = (code: number): string | undefined => errorCodes.find((e) => e.code == code)?.name;
