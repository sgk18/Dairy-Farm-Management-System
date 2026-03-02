/*
 * ============================================================
 *         DAIRY FARM MANAGEMENT SYSTEM  -  "MILK IT"
 * ============================================================
 *  Data Structures used
 *  -------------------------------------------------------
 *  1. Doubly Linked List   - Cow records
 *  2. Stack (SLL)          - Milk entries (LIFO)
 *  3. Binary Search Tree   - Fast cow ID lookup / deletion
 *  4. Array + Bubble Sort  - Cows ranked by avg milk yield
 *  5. Hash Table           - Customer profiles (chaining)
 *  6. Priority Queue       - Premium orders served first
 *  7. Circular Linked List - Rotating delivery-zone schedule
 *  8. Graph (Adj. Matrix)  - Delivery locations + BFS
 *  9. Singly Linked List   - Sales records & monthly reports
 * ============================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

/* ---- Constants ---- */
#define RATE         50
#define GST          0.05
#define HASH_SIZE    101     /* prime number reduces collisions   */
#define MAX_NODES    10      /* max graph delivery locations      */

/* ============================================================
 *  STRUCTURE DEFINITIONS
 * ============================================================ */

/* DS 1 - Doubly Linked List node: Cow record */
typedef struct Cow {
    int   id;
    char  breed[30];
    int   age;
    float avgMilk;
    struct Cow *prev;
    struct Cow *next;
} Cow;

/* DS 2 - Stack node: Milk entry */
typedef struct Milk {
    float        quantity;
    struct Milk *next;
} Milk;

/* DS 3 - BST node: indexed by cow ID */
typedef struct BSTNode {
    int            cowId;
    struct BSTNode *left;
    struct BSTNode *right;
} BSTNode;

/* DS 5 - Hash-table entry: Customer profile (chaining) */
typedef struct HashEntry {
    int   customerId;
    char  name[30];
    char  type[12];           /* "Premium" | "Regular"          */
    struct HashEntry *next;   /* next in chain (collision)       */
} HashEntry;

/* DS 6 - Priority-queue node: Order */
typedef struct PrioOrder {
    int   id;
    char  name[30];
    float quantity;
    float total;
    int   priority;           /* 1 = Premium (higher), 2 = Regular */
    struct PrioOrder *next;
} PrioOrder;

/* DS 7 - Circular Linked List node: Delivery Zone */
typedef struct Zone {
    int   zoneId;
    char  zoneName[30];
    struct Zone *next;
} Zone;

/* DS 9 - Sales list node */
typedef struct Sale {
    char  date[11];
    float revenue;
    struct Sale *next;
} Sale;

/* DS 8 - Graph node descriptor */
typedef struct {
    char name[30];
    int  used;
} GNode;

/* ============================================================
 *  GLOBAL STATE
 * ============================================================ */
Cow       *cowHead   = NULL;         /* DS1: DLL head              */
Milk      *milkTop   = NULL;         /* DS2: Stack top             */
Sale      *saleHead  = NULL;         /* DS9: Sales list head       */

BSTNode   *bstRoot   = NULL;         /* DS3: BST root (cow IDs)    */

HashEntry *hashTable[HASH_SIZE];     /* DS5: Hash table            */

PrioOrder *prioFront = NULL;         /* DS6: Priority queue front  */

Zone      *zoneTail  = NULL;         /* DS7: Circular LL tail ptr  */

/* DS8: Graph */
int   adjMatrix[MAX_NODES][MAX_NODES];
GNode gNodes[MAX_NODES];
int   gNodeCount = 0;

/* ============================================================
 *  INPUT HELPERS
 * ============================================================ */

/* Read a strictly-positive integer with full error recovery. */
int readInt(const char *prompt)
{
    int  value;
    char term;
    while (1) {
        printf("%s", prompt);
        if (scanf("%d%c", &value, &term) == 2 && term == '\n' && value > 0)
            return value;
        printf("  Invalid! Enter a positive integer.\n");
        while (getchar() != '\n');
    }
}

/* Read a non-negative float with error recovery. */
float readPosFloat(const char *prompt)
{
    float v;
    while (1) {
        printf("%s", prompt);
        if (scanf("%f", &v) == 1 && v >= 0.0f) {
            while (getchar() != '\n');
            return v;
        }
        printf("  Invalid! Enter a non-negative number.\n");
        while (getchar() != '\n');
    }
}

/* Read a string composed only of alphabetic characters. */
void readAlpha(char *buf, int maxLen, const char *prompt)
{
    int valid, i;
    (void)maxLen;   /* size enforced by scanf format specifier */
    do {
        valid = 1;
        printf("%s", prompt);
        scanf("%29s", buf);
        while (getchar() != '\n');
        for (i = 0; buf[i]; i++) {
            if (!isalpha((unsigned char)buf[i])) {
                valid = 0;
                printf("  Only alphabets allowed!\n");
                break;
            }
        }
    } while (!valid);
}

/* ============================================================
 *  DATE VALIDATION
 * ============================================================ */
int isLeapYear(int year)
{
    return (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
}

int validateDate(const char *date)
{
    int dd, mm, yyyy;
    if (sscanf(date, "%2d/%2d/%4d", &dd, &mm, &yyyy) != 3) return 0;
    if (yyyy < 1900 || yyyy > 2100) return 0;
    if (mm < 1  || mm > 12)        return 0;
    int maxDay[] = {0,31,28,31,30,31,30,31,31,30,31,30,31};
    if (isLeapYear(yyyy)) maxDay[2] = 29;
    return (dd >= 1 && dd <= maxDay[mm]);
}

/* ============================================================
 *  ADMIN LOGIN
 * ============================================================ */
void adminLogin(void)
{
    char user[20], pass[20];
    int  attempts = 3;
    printf("\n===== ADMIN LOGIN =====\n");
    while (attempts--) {
        printf("Username: "); scanf("%19s", user);
        printf("Password: "); scanf("%19s", pass);
        while (getchar() != '\n');
        if (strcmp(user, "admin") == 0 && strcmp(pass, "1234") == 0) {
            printf("  Login Successful!\n");
            return;
        }
        printf("  Invalid credentials! Attempts left: %d\n", attempts);
    }
    printf("  System Locked! Too many failed attempts.\n");
    exit(0);
}

/* ============================================================
 *  DS3: BST OPERATIONS  (Binary Search Tree - Cow ID index)
 * ============================================================ */

/* Insert a cow ID; returns updated root. */
BSTNode *bstInsert(BSTNode *root, int id)
{
    if (!root) {
        BSTNode *n  = (BSTNode *)malloc(sizeof(BSTNode));
        n->cowId    = id;
        n->left     = n->right = NULL;
        return n;
    }
    if      (id < root->cowId) root->left  = bstInsert(root->left,  id);
    else if (id > root->cowId) root->right = bstInsert(root->right, id);
    return root;
}

/* Return 1 if id found, 0 otherwise. */
int bstSearch(BSTNode *root, int id)
{
    if (!root)             return 0;
    if (id == root->cowId) return 1;
    return (id < root->cowId) ? bstSearch(root->left,  id)
                              : bstSearch(root->right, id);
}

/* Minimum-key node in sub-tree (used by delete). */
static BSTNode *bstMinNode(BSTNode *node)
{
    while (node->left) node = node->left;
    return node;
}

/* Delete a cow ID; returns updated root. */
BSTNode *bstDelete(BSTNode *root, int id)
{
    if (!root) return NULL;
    if      (id < root->cowId) root->left  = bstDelete(root->left,  id);
    else if (id > root->cowId) root->right = bstDelete(root->right, id);
    else {
        if (!root->left)  { BSTNode *t = root->right; free(root); return t; }
        if (!root->right) { BSTNode *t = root->left;  free(root); return t; }
        BSTNode *succ = bstMinNode(root->right);
        root->cowId  = succ->cowId;
        root->right  = bstDelete(root->right, succ->cowId);
    }
    return root;
}

/* ============================================================
 *  DS1: COW - DOUBLY LINKED LIST OPERATIONS
 * ============================================================ */

/* Linear scan of DLL after BST confirms the cow exists. */
Cow *findCowById(int id)
{
    Cow *t = cowHead;
    while (t) { if (t->id == id) return t; t = t->next; }
    return NULL;
}

/* Add a new cow to the DLL and register its ID in the BST. */
void addCow(void)
{
    int id;
    printf("\n-- Add Cow --\n");
    while (1) {
        id = readInt("  Cow ID            : ");
        if (!bstSearch(bstRoot, id)) break;
        printf("  ID %d already exists! Try a different ID.\n", id);
    }
    Cow *c = (Cow *)malloc(sizeof(Cow));
    if (!c) { printf("  Memory allocation failed!\n"); return; }
    c->id = id;
    readAlpha(c->breed, 30,  "  Breed             : ");
    c->age     = readInt(    "  Age (years)        : ");
    c->avgMilk = readPosFloat("  Avg Milk (L/day)  : ");
    /* Prepend to DLL */
    c->prev = NULL; c->next = cowHead;
    if (cowHead) cowHead->prev = c;
    cowHead = c;
    /* Index in BST */
    bstRoot = bstInsert(bstRoot, id);
    printf("  Cow #%d added successfully!\n", id);
}

/* Display all cows via DLL traversal. */
void displayCows(void)
{
    Cow *t = cowHead;
    if (!t) { printf("  No cows on record.\n"); return; }
    printf("\n  %-6s %-22s %-6s %-14s\n",
           "ID", "Breed", "Age", "AvgMilk(L/day)");
    printf("  %-6s %-22s %-6s %-14s\n",
           "------","----------------------","------","--------------");
    while (t) {
        printf("  %-6d %-22s %-6d %-14.2f\n",
               t->id, t->breed, t->age, t->avgMilk);
        t = t->next;
    }
}

/* Search cow using BST for O(log n) performance. */
void searchCow(void)
{
    printf("\n-- Search Cow (BST - O(log n)) --\n");
    int id = readInt("  Enter Cow ID: ");
    if (bstSearch(bstRoot, id)) {
        Cow *c = findCowById(id);
        if (c)
            printf("  Found -> ID:%-4d | Breed:%-20s | Age:%d | AvgMilk:%.2f L\n",
                   c->id, c->breed, c->age, c->avgMilk);
    } else {
        printf("  Cow #%d not found.\n", id);
    }
}

/*
 * Delete a cow (sell / retire).
 * Removes the record from (a) the Doubly Linked List and
 *                          (b) the BST index.
 */
void deleteCow(void)
{
    printf("\n-- Delete Cow (Sell / Retire) --\n");
    int id = readInt("  Enter Cow ID to remove: ");
    if (!bstSearch(bstRoot, id)) { printf("  Cow #%d not found.\n", id); return; }
    Cow *c = findCowById(id);
    if (c->prev) c->prev->next = c->next; else cowHead = c->next;
    if (c->next) c->next->prev = c->prev;
    printf("  Cow #%d (%s) sold / retired from the farm.\n", c->id, c->breed);
    free(c);
    bstRoot = bstDelete(bstRoot, id);
}

/* ============================================================
 *  DS4: ARRAY + BUBBLE SORT  (Sort cows by avgMilk descending)
 * ============================================================ */
void sortCowsByMilk(void)
{
    printf("\n-- Sort Cows by Average Milk Yield (Descending) --\n");
    int  n = 0;
    Cow *t = cowHead;
    while (t) { n++; t = t->next; }
    if (n == 0) { printf("  No cows to sort.\n"); return; }

    /* Collect DLL node pointers into an array */
    Cow **arr = (Cow **)malloc(n * sizeof(Cow *));
    if (!arr) { printf("  Memory allocation failed!\n"); return; }
    t = cowHead;
    for (int i = 0; i < n; i++, t = t->next) arr[i] = t;

    /* Bubble sort - descending avgMilk */
    for (int i = 0; i < n - 1; i++)
        for (int j = 0; j < n - i - 1; j++)
            if (arr[j]->avgMilk < arr[j+1]->avgMilk) {
                Cow *tmp = arr[j]; arr[j] = arr[j+1]; arr[j+1] = tmp;
            }

    printf("\n  %-5s %-6s %-22s %-6s %-14s\n",
           "Rank","ID","Breed","Age","AvgMilk(L/day)");
    printf("  %-5s %-6s %-22s %-6s %-14s\n",
           "-----","------","----------------------","------","----------");
    for (int i = 0; i < n; i++)
        printf("  %-5d %-6d %-22s %-6d %-14.2f\n",
               i+1, arr[i]->id, arr[i]->breed, arr[i]->age, arr[i]->avgMilk);
    free(arr);
}

/* ============================================================
 *  DS2: MILK STACK  (Singly Linked List as Stack - LIFO)
 * ============================================================ */
void pushMilk(void)
{
    printf("\n-- Add Milk Entry (Stack Push) --\n");
    Milk *m = (Milk *)malloc(sizeof(Milk));
    if (!m) { printf("  Memory allocation failed!\n"); return; }
    m->quantity = readPosFloat("  Milk collected (L): ");
    m->next     = milkTop;
    milkTop     = m;
    printf("  Entry pushed: %.2f L recorded.\n", m->quantity);
}

float totalMilk(void)
{
    float total = 0.0f;
    Milk *t = milkTop;
    while (t) { total += t->quantity; t = t->next; }
    return total;
}

/* ============================================================
 *  DS5: HASH TABLE  (Customer Profiles - separate chaining)
 *       Hash function: Division method  h(k) = k mod HASH_SIZE
 * ============================================================ */
void hashInit(void)
{
    for (int i = 0; i < HASH_SIZE; i++) hashTable[i] = NULL;
}

int hashFunc(int id)
{
    return ((id % HASH_SIZE) + HASH_SIZE) % HASH_SIZE;
}

/* Register a new customer. */
void addCustomerProfile(void)
{
    printf("\n-- Add Customer Profile (Hash Table) --\n");
    int id  = readInt("  Customer ID  : ");
    int idx = hashFunc(id);
    for (HashEntry *c = hashTable[idx]; c; c = c->next)
        if (c->customerId == id) { printf("  Customer #%d already exists!\n", id); return; }

    HashEntry *e = (HashEntry *)malloc(sizeof(HashEntry));
    if (!e) { printf("  Memory allocation failed!\n"); return; }
    e->customerId = id;
    readAlpha(e->name, 30, "  Name         : ");
    int t; printf("  Type (1=Premium / 2=Regular): "); scanf("%d", &t); while (getchar()!='\n');
    strcpy(e->type, (t == 1) ? "Premium" : "Regular");
    e->next        = hashTable[idx];
    hashTable[idx] = e;
    printf("  Customer '%s' (#%d) registered as %s.\n", e->name, id, e->type);
}

/* Look up a customer profile by ID. */
void searchCustomerProfile(void)
{
    printf("\n-- Search Customer Profile (Hash Table) --\n");
    int id  = readInt("  Customer ID: ");
    int idx = hashFunc(id);
    for (HashEntry *c = hashTable[idx]; c; c = c->next)
        if (c->customerId == id) {
            printf("  Found -> ID:%-6d | Name:%-20s | Type:%s\n",
                   c->customerId, c->name, c->type);
            return;
        }
    printf("  Customer #%d not found.\n", id);
}

/* Delete a customer profile - Deletion operation for hash table. */
void deleteCustomerProfile(void)
{
    printf("\n-- Delete Customer Profile --\n");
    int id = readInt("  Customer ID to delete: ");
    int idx = hashFunc(id);
    HashEntry *cur = hashTable[idx], *prev = NULL;
    while (cur) {
        if (cur->customerId == id) {
            if (prev) prev->next     = cur->next;
            else      hashTable[idx] = cur->next;
            printf("  Customer #%d (%s) deleted.\n", cur->customerId, cur->name);
            free(cur);
            return;
        }
        prev = cur; cur = cur->next;
    }
    printf("  Customer #%d not found.\n", id);
}

/* ============================================================
 *  DS6: PRIORITY QUEUE  (Premium orders served before Regular)
 *       Sorted insertion: priority 1 (Premium) < priority 2 (Regular)
 * ============================================================ */

/* Place a new order; priority is auto-detected from the hash table. */
void placeOrder(void)
{
    printf("\n-- Place Order (Priority Queue) --\n");
    int id  = readInt("  Customer ID: ");
    int idx = hashFunc(id);
    HashEntry *cust = hashTable[idx];
    while (cust && cust->customerId != id) cust = cust->next;

    int  prio;
    char custName[30];
    if (cust) {
        prio = (strcmp(cust->type, "Premium") == 0) ? 1 : 2;
        strncpy(custName, cust->name, 29); custName[29] = '\0';
        printf("  Customer '%s' (%s) - Priority %d assigned.\n",
               custName, cust->type, prio);
    } else {
        printf("  Customer not in system. Defaulting to Regular priority.\n");
        readAlpha(custName, 30, "  Customer Name: ");
        prio = 2;
    }

    PrioOrder *o = (PrioOrder *)malloc(sizeof(PrioOrder));
    if (!o) { printf("  Memory allocation failed!\n"); return; }
    o->id = id; o->priority = prio;
    strncpy(o->name, custName, 29); o->name[29] = '\0';
    o->quantity = readPosFloat("  Milk quantity (L): ");
    float sub   = o->quantity * RATE;
    o->total    = sub + sub * (float)GST;
    o->next     = NULL;

    /* Sorted insertion by priority (ascending priority number) */
    if (!prioFront || o->priority < prioFront->priority) {
        o->next = prioFront; prioFront = o;
    } else {
        PrioOrder *cur = prioFront;
        while (cur->next && cur->next->priority <= o->priority)
            cur = cur->next;
        o->next = cur->next; cur->next = o;
    }

    FILE *f = fopen("bills.txt", "a");
    if (f) {
        fprintf(f, "[%-7s] Customer:%-20s Qty:%7.2f L  Total:%.2f\n",
                prio == 1 ? "PREMIUM":"REGULAR", o->name, o->quantity, o->total);
        fclose(f);
    }
    printf("  Order placed! Bill: %.2f  [%s]\n",
           o->total, prio == 1 ? "PREMIUM":"REGULAR");
}

/* Dequeue and fulfil the front (highest-priority) order. */
void processNextOrder(void)
{
    printf("\n-- Process Next Order --\n");
    if (!prioFront) { printf("  No orders in queue.\n"); return; }
    PrioOrder *o = prioFront;
    prioFront    = prioFront->next;
    printf("  Fulfilling [%s] Order -> Customer:%-20s | Qty:%.2f L | Total:%.2f\n",
           o->priority == 1 ? "PREMIUM":"REGULAR",
           o->name, o->quantity, o->total);
    free(o);
}

/* Cancel (delete) an order by customer ID - explicit Deletion operation. */
void cancelOrder(void)
{
    printf("\n-- Cancel Order (Deletion from Priority Queue) --\n");
    if (!prioFront) { printf("  No orders to cancel.\n"); return; }
    int id = readInt("  Customer ID whose order to cancel: ");
    PrioOrder *cur = prioFront, *prev = NULL;
    while (cur) {
        if (cur->id == id) {
            if (prev) prev->next = cur->next; else prioFront = cur->next;
            printf("  Order for customer #%d (%s) cancelled.\n",
                   cur->id, cur->name);
            free(cur);
            return;
        }
        prev = cur; cur = cur->next;
    }
    printf("  No order found for customer #%d.\n", id);
}

/* Display all pending orders in current priority order. */
void displayOrders(void)
{
    if (!prioFront) { printf("  No pending orders.\n"); return; }
    printf("\n  %-4s %-9s %-22s %-10s %-10s\n",
           "#","Priority","Customer","Qty(L)","Total");
    printf("  %-4s %-9s %-22s %-10s %-10s\n",
           "----","---------","----------------------","----------","----------");
    int i = 1;
    for (PrioOrder *cur = prioFront; cur; cur = cur->next)
        printf("  %-4d %-9s %-22s %-10.2f %-10.2f\n",
               i++,
               cur->priority == 1 ? "PREMIUM":"REGULAR",
               cur->name, cur->quantity, cur->total);
}

/* ============================================================
 *  DS7: CIRCULAR LINKED LIST  (Rotating delivery-zone schedule)
 *       zoneTail->next always points back to the head (zone 1)
 * ============================================================ */

/* Append a new delivery zone to the circular rotation. */
void addDeliveryZone(void)
{
    printf("\n-- Add Delivery Zone (Circular Linked List) --\n");
    Zone *z = (Zone *)malloc(sizeof(Zone));
    if (!z) { printf("  Memory allocation failed!\n"); return; }
    z->zoneId = readInt("  Zone ID  : ");
    readAlpha(z->zoneName, 30, "  Zone Name: ");
    z->next   = NULL;
    if (!zoneTail) {
        z->next  = z;       /* Self-loop for single node */
        zoneTail = z;
    } else {
        z->next        = zoneTail->next;   /* new->next = head */
        zoneTail->next = z;
        zoneTail       = z;
    }
    printf("  Zone #%d '%s' added to circular schedule.\n",
           z->zoneId, z->zoneName);
}

/* Traverse the full circular rotation once and display. */
void displayDeliverySchedule(void)
{
    printf("\n-- Circular Delivery Schedule (one full rotation) --\n");
    if (!zoneTail) { printf("  No delivery zones defined.\n"); return; }
    Zone *head = zoneTail->next, *cur = head;
    int   n    = 0;
    do {
        printf("  Step %2d -> Zone #%-3d  %s\n", ++n, cur->zoneId, cur->zoneName);
        cur = cur->next;
        if (n > 500) break;
    } while (cur != head);
    printf("  (Circular: after '%s', route returns to '%s')\n",
           zoneTail->zoneName, head->zoneName);
}

static int countZones(void)
{
    if (!zoneTail) return 0;
    Zone *h = zoneTail->next, *c = h; int n = 0;
    do { n++; c = c->next; if (n > 100000) break; } while (c != h);
    return n;
}

/* ============================================================
 *  DS8: GRAPH  (Delivery Locations + BFS Traversal)
 *       Undirected adjacency-matrix graph, max MAX_NODES nodes.
 * ============================================================ */
void initGraph(void)
{
    gNodeCount = 0;
    for (int i = 0; i < MAX_NODES; i++) {
        gNodes[i].used = 0; gNodes[i].name[0] = '\0';
        for (int j = 0; j < MAX_NODES; j++) adjMatrix[i][j] = 0;
    }
}

/* Add a delivery location as a graph vertex. */
void addDeliveryLocation(void)
{
    printf("\n-- Add Delivery Location (Graph Node) --\n");
    if (gNodeCount >= MAX_NODES) {
        printf("  Maximum locations (%d) reached.\n", MAX_NODES); return;
    }
    printf("  Location name: "); scanf("%29s", gNodes[gNodeCount].name);
    while (getchar() != '\n');
    gNodes[gNodeCount].used = 1;
    printf("  '%s' added as Node [%d].\n",
           gNodes[gNodeCount].name, gNodeCount + 1);
    gNodeCount++;
}

/* Add a bidirectional road between two existing locations. */
void addDeliveryRoute(void)
{
    printf("\n-- Add Delivery Route (Graph Edge) --\n");
    if (gNodeCount < 2) { printf("  Need at least 2 locations first.\n"); return; }
    printf("  Existing Locations:\n");
    for (int i = 0; i < gNodeCount; i++)
        printf("    [%d] %s\n", i + 1, gNodes[i].name);
    int u = readInt("  From Node number: ") - 1;
    int v = readInt("  To   Node number: ") - 1;
    if (u < 0 || u >= gNodeCount || v < 0 || v >= gNodeCount || u == v) {
        printf("  Invalid node selection.\n"); return;
    }
    adjMatrix[u][v] = adjMatrix[v][u] = 1;
    printf("  Route added: %s <---> %s\n",
           gNodes[u].name, gNodes[v].name);
}

/* Breadth-First Search traversal from a chosen start node. */
static void bfs(int start)
{
    int visited[MAX_NODES] = {0};
    int queue[MAX_NODES]; int qf = 0, qr = 0;
    visited[start] = 1; queue[qr++] = start;
    printf("  BFS from '%s':  ", gNodes[start].name);
    while (qf < qr) {
        int u = queue[qf++];
        printf("%s  ", gNodes[u].name);
        for (int v = 0; v < gNodeCount; v++)
            if (adjMatrix[u][v] && !visited[v]) { visited[v] = 1; queue[qr++] = v; }
    }
    printf("\n");
}

void traverseDeliveryGraph(void)
{
    printf("\n-- Traverse Delivery Graph (BFS) --\n");
    if (gNodeCount == 0) { printf("  No delivery locations defined.\n"); return; }
    printf("  Locations:\n");
    for (int i = 0; i < gNodeCount; i++)
        printf("    [%d] %s\n", i + 1, gNodes[i].name);
    int s = readInt("  Start Node number: ") - 1;
    if (s < 0 || s >= gNodeCount) { printf("  Invalid node.\n"); return; }
    bfs(s);
}

/* ============================================================
 *  DS9: SALES LIST  (Singly Linked List)
 * ============================================================ */
void addSale(void)
{
    printf("\n-- Record Daily Sale --\n");
    Sale *s = (Sale *)malloc(sizeof(Sale));
    if (!s) { printf("  Memory allocation failed!\n"); return; }
    do {
        printf("  Date (DD/MM/YYYY): "); scanf("%10s", s->date); while (getchar()!='\n');
        if (!validateDate(s->date)) printf("  Invalid date! Try again.\n");
    } while (!validateDate(s->date));
    s->revenue = readPosFloat("  Revenue: ");
    s->next    = saleHead;
    saleHead   = s;
    printf("  Sale recorded successfully!\n");
}

void monthlyReport(void)
{
    printf("\n-- Monthly Revenue Report --\n");
    printf("  Enter Month (1-12): ");
    int m; scanf("%d", &m); while (getchar()!='\n');
    if (m < 1 || m > 12) { printf("  Invalid month.\n"); return; }
    char ms[3]; sprintf(ms, "%02d", m);
    float total = 0.0f; int count = 0;
    for (Sale *t = saleHead; t; t = t->next)
        if (strncmp(t->date + 3, ms, 2) == 0) { total += t->revenue; count++; }
    printf("  Month %02d: %d sale(s) | Total Revenue: %.2f\n", m, count, total);
}

/* ============================================================
 *  FILE HANDLING
 * ============================================================ */
void saveCows(void)
{
    FILE *f = fopen("cows.txt", "w");
    if (!f) { printf("  Cannot open cows.txt for writing!\n"); return; }
    for (Cow *t = cowHead; t; t = t->next)
        fprintf(f, "%d %s %d %.2f\n", t->id, t->breed, t->age, t->avgMilk);
    fclose(f);
}

void loadCows(void)
{
    FILE *f = fopen("cows.txt", "r");
    if (!f) return;
    int id, age; char breed[30]; float avgMilk;
    while (fscanf(f, "%d %29s %d %f", &id, breed, &age, &avgMilk) == 4) {
        if (!bstSearch(bstRoot, id)) {
            Cow *c = (Cow *)malloc(sizeof(Cow));
            c->id = id;
            strncpy(c->breed, breed, 29); c->breed[29] = '\0';
            c->age = age; c->avgMilk = avgMilk;
            c->prev = NULL; c->next = cowHead;
            if (cowHead) cowHead->prev = c;
            cowHead = c;
            bstRoot = bstInsert(bstRoot, id);
        }
    }
    fclose(f);
}

/* ============================================================
 *  DASHBOARD
 * ============================================================ */
void dashboard(void)
{
    int cowCount = 0, orderCount = 0;
    for (Cow *c = cowHead; c; c = c->next) cowCount++;
    for (PrioOrder *o = prioFront; o; o = o->next) orderCount++;
    printf("\n  +====================================+\n");
    printf(  "  |      DAIRY FARM DASHBOARD          |\n");
    printf(  "  +====================================+\n");
    printf(  "  |  Total Cows          : %-10d  |\n",  cowCount);
    printf(  "  |  Total Milk Today    : %-10.2f  |\n", totalMilk());
    printf(  "  |  Pending Orders      : %-10d  |\n",  orderCount);
    printf(  "  |  Delivery Zones      : %-10d  |\n",  countZones());
    printf(  "  |  Delivery Locations  : %-10d  |\n",  gNodeCount);
    printf(  "  +====================================+\n");
}

/* ============================================================
 *  MAIN  -  Menu-driven interface
 * ============================================================ */
int main(void)
{
    hashInit();
    initGraph();
    loadCows();
    adminLogin();

    int choice;
    while (1) {
        printf("\n");
        printf("  +================================================+\n");
        printf("  |       DAIRY FARM MANAGEMENT SYSTEM             |\n");
        printf("  +================================================+\n");
        printf("  |  COW MANAGEMENT   (Doubly Linked List + BST)   |\n");
        printf("  |   1.  Add Cow                                  |\n");
        printf("  |   2.  Display All Cows                         |\n");
        printf("  |   3.  Search Cow           [BST - O(log n)]    |\n");
        printf("  |   4.  Delete Cow           [DLL + BST]         |\n");
        printf("  |   5.  Sort by Milk Yield   [Array + BubbleSort]|\n");
        printf("  +------------------------------------------------+\n");
        printf("  |  MILK   (Stack - LIFO Singly Linked List)      |\n");
        printf("  |   6.  Add Milk Entry                           |\n");
        printf("  +------------------------------------------------+\n");
        printf("  |  CUSTOMER PROFILES   (Hash Table)              |\n");
        printf("  |   7.  Add Customer Profile                     |\n");
        printf("  |   8.  Search Customer Profile                  |\n");
        printf("  |   9.  Delete Customer Profile  [Deletion]      |\n");
        printf("  +------------------------------------------------+\n");
        printf("  |  ORDERS   (Priority Queue)                     |\n");
        printf("  |  10.  Place Order                              |\n");
        printf("  |  11.  Process Next Order                       |\n");
        printf("  |  12.  Cancel an Order          [Deletion]      |\n");
        printf("  |  13.  View Pending Orders                      |\n");
        printf("  +------------------------------------------------+\n");
        printf("  |  DELIVERY SCHEDULE   (Circular Linked List)    |\n");
        printf("  |  14.  Add Delivery Zone                        |\n");
        printf("  |  15.  View Circular Schedule                   |\n");
        printf("  +------------------------------------------------+\n");
        printf("  |  DELIVERY GRAPH   (Graph + BFS Traversal)      |\n");
        printf("  |  16.  Add Delivery Location  [Graph Node]      |\n");
        printf("  |  17.  Add Delivery Route     [Graph Edge]      |\n");
        printf("  |  18.  Traverse Graph         [BFS]             |\n");
        printf("  +------------------------------------------------+\n");
        printf("  |  REPORTS                                       |\n");
        printf("  |  19.  Record Sale                              |\n");
        printf("  |  20.  Monthly Revenue Report                   |\n");
        printf("  |  21.  Dashboard                                |\n");
        printf("  |  22.  Save & Exit                              |\n");
        printf("  +================================================+\n");
        printf("  Enter Choice: ");

        if (scanf("%d", &choice) != 1) {
            printf("  Invalid input! Enter a number 1-22.\n");
            while (getchar() != '\n');
            continue;
        }
        while (getchar() != '\n');

        switch (choice) {
            case  1: addCow();                  break;
            case  2: displayCows();             break;
            case  3: searchCow();               break;
            case  4: deleteCow();               break;
            case  5: sortCowsByMilk();          break;
            case  6: pushMilk();                break;
            case  7: addCustomerProfile();      break;
            case  8: searchCustomerProfile();   break;
            case  9: deleteCustomerProfile();   break;
            case 10: placeOrder();              break;
            case 11: processNextOrder();        break;
            case 12: cancelOrder();             break;
            case 13: displayOrders();           break;
            case 14: addDeliveryZone();         break;
            case 15: displayDeliverySchedule(); break;
            case 16: addDeliveryLocation();     break;
            case 17: addDeliveryRoute();        break;
            case 18: traverseDeliveryGraph();   break;
            case 19: addSale();                 break;
            case 20: monthlyReport();           break;
            case 21: dashboard();               break;
            case 22:
                saveCows();
                printf("  Data saved. Goodbye!\n");
                exit(0);
            default:
                printf("  Invalid choice! Enter 1-22.\n");
        }
    }
    return 0;
}

