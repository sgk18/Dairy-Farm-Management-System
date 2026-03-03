

/*
 * ============================================================
 * DAIRY FARM MANAGEMENT SYSTEM  -  "MILK IT"
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
 * STRUCTURE DEFINITIONS
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
    struct HashEntry *next;   /* next in chain (collision)      */
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
 * GLOBAL STATE
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
 * UI & INPUT HELPERS
 * ============================================================ */

void pauseScreen() {
    printf("\nPress Enter to continue...");
    getchar();
}

int readInt(const char *prompt) {
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

float readPosFloat(const char *prompt) {
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

void readAlpha(char *buf, int maxLen, const char *prompt) {
    int valid, i;
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
 * DATE VALIDATION
 * ============================================================ */
int isLeapYear(int year) {
    return (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
}

int validateDate(const char *date) {
    int dd, mm, yyyy;
    if (sscanf(date, "%2d/%2d/%4d", &dd, &mm, &yyyy) != 3) return 0;
    if (yyyy < 1900 || yyyy > 2100) return 0;
    if (mm < 1  || mm > 12)        return 0;
    int maxDay[] = {0,31,28,31,30,31,30,31,31,30,31,30,31};
    if (isLeapYear(yyyy)) maxDay[2] = 29;
    return (dd >= 1 && dd <= maxDay[mm]);
}

/* ============================================================
 * ADMIN LOGIN
 * ============================================================ */
void adminLogin(void) {
    char user[20], pass[20];
    int  attempts = 3;
    system("cls");
    printf("\n========================================\n");
    printf("        DAIRY FARM ADMIN LOGIN\n");
    printf("========================================\n");
    while (attempts--) {
        printf("Username: "); scanf("%19s", user);
        printf("Password: "); scanf("%19s", pass);
        while (getchar() != '\n');
        if (strcmp(user, "admin") == 0 && strcmp(pass, "1234") == 0) {
            printf("\n  [+] Login Successful!\n");
            pauseScreen();
            return;
        }
        printf("  [-] Invalid credentials! Attempts left: %d\n\n", attempts);
    }
    printf("  [!] System Locked! Too many failed attempts.\n");
    exit(0);
}

/* ============================================================
 * DS3: BST OPERATIONS  (Binary Search Tree - Cow ID index)
 * ============================================================ */
BSTNode *bstInsert(BSTNode *root, int id) {
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

int bstSearch(BSTNode *root, int id) {
    if (!root)             return 0;
    if (id == root->cowId) return 1;
    return (id < root->cowId) ? bstSearch(root->left,  id)
                              : bstSearch(root->right, id);
}

static BSTNode *bstMinNode(BSTNode *node) {
    while (node->left) node = node->left;
    return node;
}

BSTNode *bstDelete(BSTNode *root, int id) {
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
 * DS1: COW - DOUBLY LINKED LIST OPERATIONS
 * ============================================================ */
Cow *findCowById(int id) {
    Cow *t = cowHead;
    while (t) { if (t->id == id) return t; t = t->next; }
    return NULL;
}

void addCow(void) {
    int id;
    Cow *c;
    printf("\n-- Add Cow --\n");
    while (1) {
        id = readInt("  Cow ID            : ");
        if (!bstSearch(bstRoot, id)) break;
        printf("  ID %d already exists! Try a different ID.\n", id);
    }
    c = (Cow *)malloc(sizeof(Cow));
    if (!c) { printf("  Memory allocation failed!\n"); return; }
    c->id = id;
    readAlpha(c->breed, 30,  "  Breed             : ");
    c->age     = readInt(    "  Age (years)       : ");
    c->avgMilk = readPosFloat("  Avg Milk (L/day)  : ");
   
    c->prev = NULL; c->next = cowHead;
    if (cowHead) cowHead->prev = c;
    cowHead = c;
    bstRoot = bstInsert(bstRoot, id);
    printf("\n  [+] Cow #%d added successfully!\n", id);
}

void displayCows(void) {
    Cow *t = cowHead;
    if (!t) { printf("\n  [!] No cows on record.\n"); return; }
    printf("\n  %-6s %-22s %-6s %-14s\n", "ID", "Breed", "Age", "AvgMilk(L/day)");
    printf("  %-6s %-22s %-6s %-14s\n", "------", "----------------------", "------", "--------------");
    while (t) {
        printf("  %-6d %-22s %-6d %-14.2f\n", t->id, t->breed, t->age, t->avgMilk);
        t = t->next;
    }
}

void searchCow(void) {
    int id;
    printf("\n-- Search Cow --\n");
    id = readInt("  Enter Cow ID: ");
    if (bstSearch(bstRoot, id)) {
        Cow *c = findCowById(id);
        if (c)
            printf("\n  [+] Found -> ID:%-4d | Breed:%-20s | Age:%d | AvgMilk:%.2f L\n",
                   c->id, c->breed, c->age, c->avgMilk);
    } else {
        printf("\n  [-] Cow #%d not found.\n", id);
    }
}

void deleteCow(void) {
    int id;
    Cow *c;
    printf("\n-- Delete Cow (Sell / Retire) --\n");
    id = readInt("  Enter Cow ID to remove: ");
    if (!bstSearch(bstRoot, id)) { printf("\n  [-] Cow #%d not found.\n", id); return; }
    c = findCowById(id);
    if (c->prev) c->prev->next = c->next; else cowHead = c->next;
    if (c->next) c->next->prev = c->prev;
    printf("\n  [+] Cow #%d (%s) sold / retired from the farm.\n", c->id, c->breed);
    free(c);
    bstRoot = bstDelete(bstRoot, id);
}

/* ============================================================
 * DS4: ARRAY + BUBBLE SORT
 * ============================================================ */
void sortCowsByMilk(void) {
    int n = 0, i, j;
    Cow *t = cowHead;
    Cow **arr;
   
    printf("\n-- Cows by Average Milk Yield (Descending) --\n");
    while (t) { n++; t = t->next; }
    if (n == 0) { printf("\n  [!] No cows to sort.\n"); return; }

    arr = (Cow **)malloc(n * sizeof(Cow *));
    t = cowHead;
    for (i = 0; i < n; i++, t = t->next) arr[i] = t;

    for (i = 0; i < n - 1; i++) {
        for (j = 0; j < n - i - 1; j++) {
            if (arr[j]->avgMilk < arr[j+1]->avgMilk) {
                Cow *tmp = arr[j]; arr[j] = arr[j+1]; arr[j+1] = tmp;
            }
        }
    }

    printf("\n  %-5s %-6s %-22s %-6s %-14s\n", "Rank", "ID", "Breed", "Age", "AvgMilk(L)");
    printf("  %-5s %-6s %-22s %-6s %-14s\n", "-----", "------", "----------------------", "------", "----------");
    for (i = 0; i < n; i++)
        printf("  %-5d %-6d %-22s %-6d %-14.2f\n", i+1, arr[i]->id, arr[i]->breed, arr[i]->age, arr[i]->avgMilk);
    free(arr);
}

/* ============================================================
 * DS2: MILK STACK
 * ============================================================ */
void pushMilk(void) {
    Milk *m;
    printf("\n-- Add Milk Entry --\n");
    m = (Milk *)malloc(sizeof(Milk));
    if (!m) { printf("  Memory allocation failed!\n"); return; }
    m->quantity = readPosFloat("  Milk collected (L): ");
    m->next     = milkTop;
    milkTop     = m;
    printf("\n  [+] Entry pushed: %.2f L recorded.\n", m->quantity);
}

float totalMilk(void) {
    float total = 0.0f;
    Milk *t = milkTop;
    while (t) { total += t->quantity; t = t->next; }
    return total;
}

/* ============================================================
 * DS5: HASH TABLE
 * ============================================================ */
void hashInit(void) {
    int i;
    for (i = 0; i < HASH_SIZE; i++) hashTable[i] = NULL;
}

int hashFunc(int id) {
    return ((id % HASH_SIZE) + HASH_SIZE) % HASH_SIZE;
}

void addCustomerProfile(void) {
    int id, idx, t;
    HashEntry *c, *e;
   
    printf("\n-- Add Customer Profile --\n");
    id  = readInt("  Customer ID  : ");
    idx = hashFunc(id);
   
    for (c = hashTable[idx]; c; c = c->next) {
        if (c->customerId == id) { printf("\n  [-] Customer #%d already exists!\n", id); return; }
    }

    e = (HashEntry *)malloc(sizeof(HashEntry));
    e->customerId = id;
    readAlpha(e->name, 30, "  Name         : ");
    printf("  Type (1=Premium / 2=Regular): "); scanf("%d", &t); while (getchar()!='\n');
    strcpy(e->type, (t == 1) ? "Premium" : "Regular");
    e->next        = hashTable[idx];
    hashTable[idx] = e;
    printf("\n  [+] Customer '%s' (#%d) registered as %s.\n", e->name, id, e->type);
}

void searchCustomerProfile(void) {
    int id, idx;
    HashEntry *c;
   
    printf("\n-- Search Customer --\n");
    id  = readInt("  Customer ID: ");
    idx = hashFunc(id);
   
    for (c = hashTable[idx]; c; c = c->next) {
        if (c->customerId == id) {
            printf("\n  [+] Found -> ID:%-6d | Name:%-20s | Type:%s\n", c->customerId, c->name, c->type);
            return;
        }
    }
    printf("\n  [-] Customer #%d not found.\n", id);
}

void deleteCustomerProfile(void) {
    int id, idx;
    HashEntry *cur, *prev = NULL;
   
    printf("\n-- Delete Customer --\n");
    id = readInt("  Customer ID to delete: ");
    idx = hashFunc(id);
    cur = hashTable[idx];
   
    while (cur) {
        if (cur->customerId == id) {
            if (prev) prev->next     = cur->next;
            else      hashTable[idx] = cur->next;
            printf("\n  [+] Customer #%d (%s) deleted.\n", cur->customerId, cur->name);
            free(cur);
            return;
        }
        prev = cur; cur = cur->next;
    }
    printf("\n  [-] Customer #%d not found.\n", id);
}

/* ============================================================
 * DS6: PRIORITY QUEUE
 * ============================================================ */
void placeOrder(void) {
    int id, idx, prio;
    char custName[30];
    HashEntry *cust;
    PrioOrder *o;
    float sub;
   
    printf("\n-- Place Order --\n");
    id  = readInt("  Customer ID: ");
    idx = hashFunc(id);
    cust = hashTable[idx];
   
    while (cust && cust->customerId != id) cust = cust->next;

    if (cust) {
        prio = (strcmp(cust->type, "Premium") == 0) ? 1 : 2;
        strncpy(custName, cust->name, 29); custName[29] = '\0';
        printf("  Customer '%s' (%s) - Priority %d assigned.\n", custName, cust->type, prio);
    } else {
        printf("  Customer not in system. Defaulting to Regular priority.\n");
        readAlpha(custName, 30, "  Customer Name: ");
        prio = 2;
    }

    o = (PrioOrder *)malloc(sizeof(PrioOrder));
    o->id = id; o->priority = prio;
    strncpy(o->name, custName, 29); o->name[29] = '\0';
    o->quantity = readPosFloat("  Milk quantity (L): ");
    sub   = o->quantity * RATE;
    o->total    = sub + sub * (float)GST;
    o->next     = NULL;

    if (!prioFront || o->priority < prioFront->priority) {
        o->next = prioFront; prioFront = o;
    } else {
        PrioOrder *cur = prioFront;
        while (cur->next && cur->next->priority <= o->priority)
            cur = cur->next;
        o->next = cur->next; cur->next = o;
    }
    printf("\n  [+] Order placed! Bill: %.2f  [%s]\n", o->total, prio == 1 ? "PREMIUM":"REGULAR");
}

void processNextOrder(void) {
    PrioOrder *o;
    printf("\n-- Process Next Order --\n");
    if (!prioFront) { printf("\n  [!] No orders in queue.\n"); return; }
    o = prioFront;
    prioFront = prioFront->next;
    printf("\n  [+] Fulfilling [%s] Order -> Customer:%-20s | Qty:%.2f L | Total:%.2f\n",
           o->priority == 1 ? "PREMIUM":"REGULAR", o->name, o->quantity, o->total);
    free(o);
}

void cancelOrder(void) {
    int id;
    PrioOrder *cur, *prev = NULL;
   
    printf("\n-- Cancel Order --\n");
    if (!prioFront) { printf("\n  [!] No orders to cancel.\n"); return; }
    id = readInt("  Customer ID to cancel: ");
    cur = prioFront;
   
    while (cur) {
        if (cur->id == id) {
            if (prev) prev->next = cur->next; else prioFront = cur->next;
            printf("\n  [+] Order for customer #%d (%s) cancelled.\n", cur->id, cur->name);
            free(cur);
            return;
        }
        prev = cur; cur = cur->next;
    }
    printf("\n  [-] No order found for customer #%d.\n", id);
}

void displayOrders(void) {
    int i = 1;
    PrioOrder *cur;
   
    if (!prioFront) { printf("\n  [!] No pending orders.\n"); return; }
    printf("\n  %-4s %-9s %-22s %-10s %-10s\n", "#", "Priority", "Customer", "Qty(L)", "Total");
    printf("  %-4s %-9s %-22s %-10s %-10s\n", "----", "---------", "----------------------", "----------", "----------");
   
    for (cur = prioFront; cur; cur = cur->next) {
        printf("  %-4d %-9s %-22s %-10.2f %-10.2f\n", i++,
               cur->priority == 1 ? "PREMIUM":"REGULAR", cur->name, cur->quantity, cur->total);
    }
}

/* ============================================================
 * DS7: CIRCULAR LINKED LIST
 * ============================================================ */
void addDeliveryZone(void) {
    Zone *z;
    printf("\n-- Add Delivery Zone --\n");
    z = (Zone *)malloc(sizeof(Zone));
    z->zoneId = readInt("  Zone ID  : ");
    readAlpha(z->zoneName, 30, "  Zone Name: ");
    z->next   = NULL;
   
    if (!zoneTail) {
        z->next  = z;
        zoneTail = z;
    } else {
        z->next        = zoneTail->next;
        zoneTail->next = z;
        zoneTail       = z;
    }
    printf("\n  [+] Zone #%d '%s' added to schedule.\n", z->zoneId, z->zoneName);
}

void displayDeliverySchedule(void) {
    Zone *head, *cur;
    int n = 0;
   
    printf("\n-- Circular Delivery Schedule --\n");
    if (!zoneTail) { printf("\n  [!] No delivery zones defined.\n"); return; }
   
    head = zoneTail->next;
    cur = head;
   
    do {
        printf("  Step %2d -> Zone #%-3d  %s\n", ++n, cur->zoneId, cur->zoneName);
        cur = cur->next;
        if (n > 500) break;
    } while (cur != head);
    printf("\n  (Route loops back to '%s')\n", head->zoneName);
}

static int countZones(void) {
    Zone *h, *c;
    int n = 0;
    if (!zoneTail) return 0;
    h = zoneTail->next;
    c = h;
    do { n++; c = c->next; if (n > 100000) break; } while (c != h);
    return n;
}

/* ============================================================
 * DS8: GRAPH
 * ============================================================ */
void initGraph(void) {
    int i, j;
    gNodeCount = 0;
    for (i = 0; i < MAX_NODES; i++) {
        gNodes[i].used = 0; gNodes[i].name[0] = '\0';
        for (j = 0; j < MAX_NODES; j++) adjMatrix[i][j] = 0;
    }
}

void addDeliveryLocation(void) {
    printf("\n-- Add Delivery Location --\n");
    if (gNodeCount >= MAX_NODES) {
        printf("\n  [!] Maximum locations (%d) reached.\n", MAX_NODES); return;
    }
    printf("  Location name: "); scanf("%29s", gNodes[gNodeCount].name);
    while (getchar() != '\n');
    gNodes[gNodeCount].used = 1;
    printf("\n  [+] '%s' added as Node [%d].\n", gNodes[gNodeCount].name, gNodeCount + 1);
    gNodeCount++;
}

void addDeliveryRoute(void) {
    int i, u, v;
    printf("\n-- Add Delivery Route --\n");
    if (gNodeCount < 2) { printf("\n  [!] Need at least 2 locations first.\n"); return; }
    printf("  Existing Locations:\n");
    for (i = 0; i < gNodeCount; i++) {
        printf("    [%d] %s\n", i + 1, gNodes[i].name);
    }
    u = readInt("  From Node number: ") - 1;
    v = readInt("  To   Node number: ") - 1;
    if (u < 0 || u >= gNodeCount || v < 0 || v >= gNodeCount || u == v) {
        printf("\n  [-] Invalid node selection.\n"); return;
    }
    adjMatrix[u][v] = adjMatrix[v][u] = 1;
    printf("\n  [+] Route added: %s <---> %s\n", gNodes[u].name, gNodes[v].name);
}

static void bfs(int start) {
    int visited[MAX_NODES] = {0};
    int queue[MAX_NODES]; int qf = 0, qr = 0;
    int u, v;
   
    visited[start] = 1; queue[qr++] = start;
    printf("\n  BFS Traversal from '%s':  ", gNodes[start].name);
    while (qf < qr) {
        u = queue[qf++];
        printf("%s -> ", gNodes[u].name);
        for (v = 0; v < gNodeCount; v++) {
            if (adjMatrix[u][v] && !visited[v]) { visited[v] = 1; queue[qr++] = v; }
        }
    }
    printf("END\n");
}

void traverseDeliveryGraph(void) {
    int i, s;
    printf("\n-- Traverse Graph --\n");
    if (gNodeCount == 0) { printf("\n  [!] No delivery locations defined.\n"); return; }
    printf("  Locations:\n");
    for (i = 0; i < gNodeCount; i++) {
        printf("    [%d] %s\n", i + 1, gNodes[i].name);
    }
    s = readInt("  Start Node number: ") - 1;
    if (s < 0 || s >= gNodeCount) { printf("\n  [-] Invalid node.\n"); return; }
    bfs(s);
}

/* ============================================================
 * DS9: SALES LIST
 * ============================================================ */
void addSale(void) {
    Sale *s;
    printf("\n-- Record Daily Sale --\n");
    s = (Sale *)malloc(sizeof(Sale));
    do {
        printf("  Date (DD/MM/YYYY): "); scanf("%10s", s->date); while (getchar()!='\n');
        if (!validateDate(s->date)) printf("  Invalid date! Try again.\n");
    } while (!validateDate(s->date));
    s->revenue = readPosFloat("  Revenue: ");
    s->next    = saleHead;
    saleHead   = s;
    printf("\n  [+] Sale recorded successfully!\n");
}

void monthlyReport(void) {
    int m, count = 0;
    char ms[3];
    float total = 0.0f;
    Sale *t;
   
    printf("\n-- Monthly Revenue Report --\n");
    printf("  Enter Month (1-12): ");
    scanf("%d", &m); while (getchar()!='\n');
    if (m < 1 || m > 12) { printf("\n  [-] Invalid month.\n"); return; }
   
    sprintf(ms, "%02d", m);
    for (t = saleHead; t; t = t->next) {
        if (strncmp(t->date + 3, ms, 2) == 0) { total += t->revenue; count++; }
    }
    printf("\n  Month %02d: %d sale(s) | Total Revenue: Rs %.2f\n", m, count, total);
}

/* ============================================================
 * FILE HANDLING
 * ============================================================ */
void saveCows(void) {
    FILE *f;
    Cow *t;
   
    f = fopen("cows.txt", "w");
    if (!f) { printf("  Cannot open cows.txt for writing!\n"); return; }
   
    for (t = cowHead; t; t = t->next) {
        fprintf(f, "%d %s %d %.2f\n", t->id, t->breed, t->age, t->avgMilk);
    }
    fclose(f);
}

void loadCows(void) {
    FILE *f = fopen("cows.txt", "r");
    int id, age; char breed[30]; float avgMilk;
    Cow *c;
   
    if (!f) return;
   
    while (fscanf(f, "%d %29s %d %f", &id, breed, &age, &avgMilk) == 4) {
        if (!bstSearch(bstRoot, id)) {
            c = (Cow *)malloc(sizeof(Cow));
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
 * DASHBOARD
 * ============================================================ */
void dashboard(void) {
    int cowCount = 0, orderCount = 0;
    Cow *c;
    PrioOrder *o;
   
    for (c = cowHead; c; c = c->next) cowCount++;
    for (o = prioFront; o; o = o->next) orderCount++;
   
    printf("\n  +====================================+\n");
    printf(  "  |       DAIRY FARM DASHBOARD         |\n");
    printf(  "  +====================================+\n");
    printf(  "  |  Total Cows          : %-10d  |\n",  cowCount);
    printf(  "  |  Total Milk Today    : %-10.2f  |\n", totalMilk());
    printf(  "  |  Pending Orders      : %-10d  |\n",  orderCount);
    printf(  "  |  Delivery Zones      : %-10d  |\n",  countZones());
    printf(  "  |  Delivery Locations  : %-10d  |\n",  gNodeCount);
    printf(  "  +====================================+\n");
}

/* ============================================================
 * MAIN  -  Menu-driven interface
 * ============================================================ */
int main(void) {
    int choice;
   
    hashInit();
    initGraph();
    loadCows();
    adminLogin();

    while (1) {
        system("cls");
        printf("\n");
        printf("  +================================================+\n");
        printf("  |           DAIRY FARM MANAGEMENT SYSTEM         |\n");
        printf("  +================================================+\n");
        printf("  |  COW MANAGEMENT                                |\n");
        printf("  |   1. Add Cow               2. Display Cows     |\n");
        printf("  |   3. Search Cow            4. Delete Cow       |\n");
        printf("  |   5. Sort by Milk Yield                        |\n");
        printf("  +------------------------------------------------+\n");
        printf("  |  MILK INVENTORY           CUSTOMER PROFILES    |\n");
        printf("  |   6. Add Milk Entry        7. Add Customer     |\n");
        printf("  |                            8. Search Customer  |\n");
        printf("  |                            9. Delete Customer  |\n");
        printf("  +------------------------------------------------+\n");
        printf("  |  ORDER MANAGEMENT                              |\n");
        printf("  |  10. Place Order          11. Process Order    |\n");
        printf("  |  12. Cancel Order         13. View Orders      |\n");
        printf("  +------------------------------------------------+\n");
        printf("  |  DELIVERY & ROUTING                            |\n");
        printf("  |  14. Add Delivery Zone    15. View Schedule    |\n");
        printf("  |  16. Add Location Node    17. Add Graph Route  |\n");
        printf("  |  18. Traverse Route (BFS)                      |\n");
        printf("  +------------------------------------------------+\n");
        printf("  |  REPORTS & DASHBOARD                           |\n");
        printf("  |  19. Record Sale          20. Monthly Report   |\n");
        printf("  |  21. Dashboard            22. Save & Exit      |\n");
        printf("  +================================================+\n");
        printf("  Enter Choice (1-22): ");

        if (scanf("%d", &choice) != 1) {
            printf("\n  [-] Invalid input! Please enter a number.\n");
            while (getchar() != '\n');
            pauseScreen();
            continue;
        }
        while (getchar() != '\n');

        system("cls");
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
                printf("\n  [+] Data saved successfully. Goodbye!\n");
                exit(0);
            default:
                printf("\n  [-] Invalid choice! Please select an option from 1 to 22.\n");
        }
        pauseScreen();
    }
    return 0;
}

